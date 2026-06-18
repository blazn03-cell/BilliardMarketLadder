import os
import json
import requests

CLAUDE_API_KEY = os.environ["CLAUDE_API_KEY"]
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
EVENT_PATH = os.environ["GITHUB_EVENT_PATH"]

with open(EVENT_PATH) as f:
    event = json.load(f)

pr = event["pull_request"]
repo = event["repository"]["full_name"]
pr_number = pr["number"]
head_sha = pr["head"]["sha"]
base_sha = pr["base"]["sha"]

# Fetch the diff
diff_url = f"https://api.github.com/repos/{repo}/compare/{base_sha}...{head_sha}"
headers = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3.diff",
}
diff_resp = requests.get(diff_url, headers=headers)
diff_text = diff_resp.text[:12000]  # keep within token limit

# Ask Claude to review
claude_resp = requests.post(
    "https://api.anthropic.com/v1/messages",
    headers={
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    },
    json={
        "model": "claude-sonnet-4-6",
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": f"Review this pull request diff for the BilliardMarketLadder app. Flag any bugs, logic errors, or issues with the share pricing, prize calculations, or registration fee constants. Be concise.\n\n```diff\n{diff_text}\n```",
            }
        ],
    },
)

review_text = claude_resp.json()["content"][0]["text"]

# Post as PR comment
comment_url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
requests.post(
    comment_url,
    headers={
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    },
    json={"body": f"## Claude PR Review\n\n{review_text}"},
)

print("Review posted.")
