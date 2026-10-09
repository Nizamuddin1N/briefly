from groq import Groq
from ddgs import DDGS
import ast
import json
import operator

from config import settings

client = Groq(api_key=settings.groq_api_key)

# ---- DEFINE TOOLS ----
# These are the actions the agent can take

def search_web(query: str) -> str:
    """Search the web and return results"""
    print(f"  [search] Searching web for: '{query}'")
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=3))
    
    if not results:
        return "No results found"
    
    formatted = []
    for r in results:
        formatted.append(f"Title: {r['title']}\nSummary: {r['body']}\nURL: {r['href']}")
    
    return "\n\n".join(formatted)

def summarise_text(text: str) -> str:
    """Summarise a long text into key points"""
    print(f"  [summarise] Summarising text...")
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": "Summarise the following text into 3-5 clear bullet points."
            },
            {
                "role": "user",
                "content": text
            }
        ],
        temperature=0.3
    )
    return response.choices[0].message.content

# Only these node types and operators are allowed through the evaluator below.
# Anything else — names, calls, attribute access, subscripts — is rejected.
_ALLOWED_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

def _eval_node(node):
    """Recursively evaluate a whitelisted arithmetic AST node."""
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError("only numeric literals are allowed")
    if isinstance(node, ast.BinOp):
        op = _ALLOWED_OPERATORS.get(type(node.op))
        if op is None:
            raise ValueError(f"operator not allowed: {type(node.op).__name__}")
        left, right = _eval_node(node.left), _eval_node(node.right)
        # A short expression can still be ruinously expensive: 9**9**9 is seven
        # characters and would pin a worker computing a 369-million-digit int.
        if isinstance(node.op, ast.Pow) and (abs(right) > 64 or abs(left) > 10**6):
            raise ValueError("exponent out of supported range")
        return op(left, right)
    if isinstance(node, ast.UnaryOp):
        op = _ALLOWED_OPERATORS.get(type(node.op))
        if op is None:
            raise ValueError(f"operator not allowed: {type(node.op).__name__}")
        return op(_eval_node(node.operand))
    raise ValueError(f"expression element not allowed: {type(node).__name__}")

def calculate(expression: str) -> str:
    """Evaluate a math expression without exposing the Python interpreter.

    The agent's input is LLM-generated, so eval() is not an option here — not
    even with a cleared __builtins__, which is a well-known bypassable sandbox.
    """
    print(f"  [calc] Calculating: {expression}")
    if len(expression) > 100:
        return "Expression too long"
    try:
        # Reject anything that is not a single arithmetic expression.
        tree = ast.parse(expression, mode="eval")
        return str(_eval_node(tree.body))
    except (SyntaxError, ValueError, ArithmeticError, TypeError) as exc:
        return f"Could not calculate that expression: {exc}"

# Tool registry — maps tool names to functions
TOOLS = {
    "search_web": search_web,
    "summarise_text": summarise_text,
    "calculate": calculate
}

# Tool descriptions sent to the LLM
TOOL_DESCRIPTIONS = """
You have access to these tools:

1. search_web(query) — searches the internet for current information
   Use when: you need facts, recent information, or external knowledge

2. summarise_text(text) — summarises long text into bullet points.
   Use when: you have gathered enough information and need to condense it

3. calculate(expression) — evaluates math expressions like "2 + 2" or "100 * 0.15"
   Use when: you need to compute something numerical

To use a tool, respond in this exact JSON format:
{
    "thought": "your reasoning about what to do next",
    "action": "tool_name",
    "input": "input to the tool"
}

When you have enough information to answer, respond in this format:
{
    "thought": "I have enough information to answer",
    "action": "final_answer",
    "input": "your complete answer here"
}

Always respond with valid JSON only. No extra text.
"""

# ---- THE AGENT LOOP ----
def run_agent(user_goal: str, max_steps: int = 8):
    print(f"\n{'='*60}")
    print(f"Agent Goal: {user_goal}")
    print(f"{'='*60}\n")
    
    # Conversation history for the agent
    messages = [
        {
            "role": "system",
            "content": f"""You are a research agent. Your job is to 
            complete the user's research goal step by step using tools.
            
            {TOOL_DESCRIPTIONS}
            
            Think carefully before each step. Use tools when needed.
            Always respond with valid JSON only."""
        },
        {
            "role": "user",
            "content": user_goal
        }
    ]
    
    # The agentic loop
    for step in range(max_steps):
        print(f"--- Step {step + 1} ---")
        
        # Ask LLM what to do next
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            temperature=0.3
        )
        
        raw = response.choices[0].message.content
        
        # Parse the JSON response
        try:
            action_data = json.loads(raw)
        except json.JSONDecodeError:
            # Try to extract JSON if there's extra text
            import re
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                action_data = json.loads(match.group())
            else:
                print("Agent returned invalid JSON, stopping.")
                break
        
        thought = action_data.get("thought", "")
        action = action_data.get("action", "")
        action_input = action_data.get("input", "")
        
        print(f"Thought: {thought}")
        print(f"Action: {action}")
        
        # Check if agent is done
        if action == "final_answer":
            print(f"\n{'='*60}")
            print(f"Final Answer:")
            print(f"{action_input}")
            print(f"{'='*60}\n")
            return action_input
        
        # Execute the tool
        if action in TOOLS:
            tool_result = TOOLS[action](action_input)
            print(f"  Result preview: {str(tool_result)[:100]}...\n")
            
            # Add this step to conversation history
            messages.append({"role": "assistant", "content": raw})
            messages.append({
                "role": "user",
                "content": f"Tool result:\n{tool_result}\n\nContinue working toward the goal."
            })
        else:
            print(f"Unknown tool: {action}")
            break
    
    print("Max steps reached")

# ---- RUN THE AGENT ----
# Guarded so that importing this module (for tests, or from another module)
# does not fire live Groq and DuckDuckGo calls.
if __name__ == "__main__":
    import sys

    goal = " ".join(sys.argv[1:]) or (
        "What is the current state of AI in 2025 and how many parameters "
        "does GPT-4 have? Also calculate 1000000 * 0.0001"
    )
    run_agent(goal)