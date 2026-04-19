import os
import sys
import json
import subprocess
import urllib.request
import urllib.error

# Environment Variables
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
JULES_API_KEY = os.getenv("JULES_API_KEY")
GITHUB_REPOSITORY = os.getenv("GITHUB_REPOSITORY")
GITHUB_EVENT_NAME = os.getenv("GITHUB_EVENT_NAME")
PR_NUMBER = os.getenv("PR_NUMBER") # Only available during pull_request

def run_git_command(command):
    result = subprocess.run(command, capture_output=True, text=True, shell=True)
    return result.stdout.strip()

def get_git_diff():
    """Gets the diff based on the event type."""
    if GITHUB_EVENT_NAME == "pull_request":
        # Get diff between PR base and head
        base_ref = os.getenv("GITHUB_BASE_REF")
        subprocess.run(f"git fetch origin {base_ref}", shell=True)
        return run_git_command(f"git diff origin/{base_ref}...HEAD")
    else:
        # Push to main: diff of the latest commit
        return run_git_command("git diff HEAD^ HEAD")

def call_jules_ai(diff_text):
    """
    Calls the hypothetical Jules AI API to analyze the code.
    Since Jules might use an OpenAI-compatible endpoint format, we structure it as such.
    """
    if not JULES_API_KEY:
        print("Warning: JULES_API_KEY is not set. Please set the JULES_API_KEY secret. Skipping AI review.")
        return []

    if not diff_text:
        print("No diff to analyze.")
        return []

    print("Analyzing diff with Jules AI...")

    system_prompt = """
    You are Jules, an expert AI Code Reviewer. Your job is to review the provided git diff.
    Find all types of issues, including:
    - P0 critical: Security vulnerabilities, hardcoded secrets.
    - P1 high: Broken logic, missing tests for new modules.
    - P2 medium: Performance bottlenecks (N+1 queries, unoptimized loops).
    - P3 low: Minor syntax errors, unused imports, bad formatting.

    You MUST output ONLY a valid JSON array of objects. Do not include markdown blocks like ```json.
    Format:
    [
      {
        "title": "[Priority] Short Issue Title",
        "body": "Detailed description and suggested fix.",
        "labels": ["bug", "security"]
      }
    ]
    """

    # Hypothetical Jules API Endpoint (Using standard Chat Completions format)
    url = os.getenv("JULES_API_BASE", "https://api.jules.ai/v1/chat/completions")

    data = {
        "model": "jules-reviewer-v1",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Review this diff:\n\n{diff_text[:15000]}"} # Truncated to avoid token limits
        ],
        "temperature": 0.2
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={"Authorization": f"Bearer {JULES_API_KEY}", "Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            ai_response = result['choices'][0]['message']['content']
            # Clean up potential markdown formatting in response
            ai_response = ai_response.strip().removeprefix('```json').removesuffix('```').strip()
            return json.loads(ai_response)
    except urllib.error.HTTPError as e:
        print(f"Jules API Error: {e.code} - {e.read().decode('utf-8')}")
        return []
    except Exception as e:
        print(f"Failed to communicate with Jules AI or parse response: {e}")
        # Return a mock response for testing purposes if API isn't live
        print("Falling back to simulated response...")
        return [{
            "title": "P3 low: Automated Review Initialized",
            "body": "Jules AI CI/CD pipeline is active, but the API endpoint was not reachable.",
            "labels": ["enhancement"]
        }]

def post_github_comment(issues):
    """Posts a summary comment on a Pull Request."""
    if not issues:
        return

    comment_body = "## 🤖 Jules AI Code Review\n\nI have reviewed this PR and found the following items:\n\n"
    for issue in issues:
        comment_body += f"### {issue.get('title')}\n"
        comment_body += f"**Labels:** `{', '.join(issue.get('labels', []))}`\n\n"
        comment_body += f"{issue.get('body')}\n\n---\n"

    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/issues/{PR_NUMBER}/comments"
    req = urllib.request.Request(
        url,
        data=json.dumps({"body": comment_body}).encode('utf-8'),
        headers={
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        method='POST'
    )
    urllib.request.urlopen(req)
    print("Successfully posted PR comment.")

def create_github_issues(issues):
    """Opens individual GitHub issues for the main branch."""
    for issue in issues:
        url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/issues"
        req = urllib.request.Request(
            url,
            data=json.dumps({
                "title": issue.get('title'),
                "body": issue.get('body') + "\n\n_Reported automatically by Jules AI._",
                "labels": issue.get('labels', [])
            }).encode('utf-8'),
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            method='POST'
        )
        urllib.request.urlopen(req)
        print(f"Successfully created issue: {issue.get('title')}")

def main():
    if not GITHUB_TOKEN or not GITHUB_REPOSITORY:
        print("Warning: Missing GitHub environment variables. Cannot proceed with github APIs.")
        return []

    diff = get_git_diff()
    issues = call_jules_ai(diff)

    if not issues:
        print("No issues found by Jules AI. Excellent code!")
        return

    if GITHUB_EVENT_NAME == "pull_request":
        print(f"Posting findings to PR #{PR_NUMBER}...")
        post_github_comment(issues)
    else:
        print("Push to main detected. Opening individual issues...")
        create_github_issues(issues)

if __name__ == "__main__":
    main()
