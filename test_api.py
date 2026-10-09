"""Manual end-to-end check against a running server.

Not a pytest suite — start the API and a Celery worker first, then run:
    python test_api.py
"""
import secrets
import sys
import time

import requests

# LLM output routinely contains characters a Windows cp1252 console cannot
# encode (narrow no-break spaces, dashes, quotes), which would crash the print
# rather than the request. Force UTF-8 on the way out.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://127.0.0.1:8000"
QUERY = "what is quantum computing?"


def get_token() -> str:
    """Sign up a throwaway user and return its bearer token.

    /research requires authentication, so the token is not optional here.
    """
    suffix = secrets.token_hex(4)
    username = f"smoketest_{suffix}"
    response = requests.post(
        f"{BASE_URL}/signup",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": "smoketest-password",
        },
        timeout=10,
    )
    response.raise_for_status()
    print(f"Signed up as {username}")
    return response.json()["access_token"]


def main() -> int:
    try:
        token = get_token()
    except requests.RequestException as exc:
        print(f"Could not authenticate — is the API running? ({exc})")
        return 1

    headers = {"Authorization": f"Bearer {token}"}

    # Step 1 - submit research task
    print("\nSubmitting research task...")
    response = requests.post(
        f"{BASE_URL}/research",
        json={"query": QUERY},
        headers=headers,
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    task_id = data["task_id"]
    print(f"Task ID: {task_id}")
    print(f"Status: {data['status']}")

    # Step 2 - poll for result
    print("\nPolling for result...")
    for attempt in range(1, 11):
        time.sleep(3)
        result_data = requests.get(
            f"{BASE_URL}/result/{task_id}", headers=headers, timeout=10
        ).json()
        print(f"Attempt {attempt}: {result_data['status']}")

        if result_data["status"] == "completed":
            print("\nFinal Result:")
            print(result_data["result"]["result"])
            print("\nSources:")
            for source in result_data["result"].get("sources", []):
                print(f"  - {source}")

            # Step 3 - confirm it landed in history
            history = requests.get(
                f"{BASE_URL}/history", headers=headers, timeout=10
            ).json()
            print(f"\nHistory entries for this user: {len(history)}")
            return 0

        if result_data["status"] == "failed":
            print("\nTask failed — check the Celery worker logs.")
            return 1

    print("\nTimed out waiting for the worker.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
