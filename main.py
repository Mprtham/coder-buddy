import argparse
import sys
import traceback
import socket

# Patch DNS resolution for api.groq.com using hardcoded Cloudflare CDN IPs
# (needed when local DNS server doesn't resolve Groq's domain properly)
_original_getaddrinfo = socket.getaddrinfo
_GROQ_IPS = ["104.18.38.236", "172.64.149.20"]
_groq_ip_idx = [0]

def _patched_getaddrinfo(host, port, *args, **kwargs):
    if host == "api.groq.com":
        ip = _GROQ_IPS[_groq_ip_idx[0] % len(_GROQ_IPS)]
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', (ip, port))]
    return _original_getaddrinfo(host, port, *args, **kwargs)

socket.getaddrinfo = _patched_getaddrinfo

from agent.graph import agent


def main():
    parser = argparse.ArgumentParser(description="Run engineering project planner")
    parser.add_argument("--recursion-limit", "-r", type=int, default=100,
                        help="Recursion limit for processing (default: 100)")

    args = parser.parse_args()

    try:
        user_prompt = ""
        while not user_prompt.strip():
            user_prompt = input("Enter your project prompt: ")
            if not user_prompt.strip():
                print("Prompt cannot be empty. Please describe what you want to build.")
        result = agent.invoke(
            {"user_prompt": user_prompt},
            {"recursion_limit": args.recursion_limit}
        )
        print("Final State:", result)
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(0)
    except Exception as e:
        traceback.print_exc()
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()