import pytest
from unittest.mock import patch, MagicMock
from tasks import research_agent_task

# ---- UNIT TESTS ----

def test_research_task_returns_correct_structure():
    """Test that research task returns expected fields"""
    # Mock the web search and LLM so tests run without internet/API
    with patch('research.DDGS') as mock_ddgs, \
         patch('research.client') as mock_client:
        
        # Fake search results
        mock_ddgs.return_value.__enter__.return_value.text.return_value = [
            {
                "title": "Machine Learning Basics",
                "body": "Machine learning is a subset of AI",
                "href": "https://example.com"
            }
        ]
        
        # Fake LLM response
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "Machine learning summary"
        mock_client.chat.completions.create.return_value = mock_response
        
        # Run the actual function (not as celery task)
        result = research_agent_task.run("what is machine learning?")
        
        # Check structure
        assert "status" in result
        assert "query" in result
        assert "result" in result
        assert result["status"] == "completed"
        assert result["query"] == "what is machine learning?"

def test_research_task_handles_no_results():
    """Test graceful handling when search returns nothing"""
    with patch('research.DDGS') as mock_ddgs:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = []
        
        result = research_agent_task.run("xyzabc123nonsense")
        
        assert result["status"] == "error"
        assert "No results found" in result["result"]

def test_query_is_preserved_in_result():
    """Test that the original query appears in result"""
    with patch('research.DDGS') as mock_ddgs, \
         patch('research.client') as mock_client:
        
        mock_ddgs.return_value.__enter__.return_value.text.return_value = [
            {"title": "Test", "body": "Test body", "href": "https://test.com"}
        ]
        
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "Test summary"
        mock_client.chat.completions.create.return_value = mock_response
        
        result = research_agent_task.run("quantum computing")
        
        assert result["query"] == "quantum computing"