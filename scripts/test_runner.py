#!/usr/bin/env python3
"""
Car Service Center - Master Automated Test Runner
=================================================
Runs all or targeted test suites across Backend (Unit + Integration)
and Frontend (Playwright E2E).

Usage:
    python scripts/test_runner.py [--all] [--unit] [--integration] [--backend] [--e2e] [--ui]
"""

import sys
import os
import time
import argparse
import subprocess
from pathlib import Path

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "src" / "backend"
FRONTEND_DIR = ROOT_DIR / "src" / "frontend"

def print_banner(title: str):
    line = "=" * 72
    print(f"\n{Colors.BOLD}{Colors.CYAN}{line}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}  {title.center(68)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{line}{Colors.RESET}\n")

def run_step(name: str, cmd: list, cwd: Path) -> dict:
    print(f"{Colors.BOLD}{Colors.BLUE}▶ Executing:{Colors.RESET} {name}...")
    start_time = time.time()
    
    # Run command in working directory
    shell_mode = sys.platform == "win32"
    result = subprocess.run(
        cmd,
        cwd=cwd,
        shell=shell_mode,
        text=True,
        capture_output=False
    )
    
    duration = time.time() - start_time
    passed = result.returncode == 0
    
    if passed:
        print(f"{Colors.GREEN}✔ {name} Passed ({duration:.2f}s){Colors.RESET}\n")
    else:
        print(f"{Colors.RED}✖ {name} Failed with code {result.returncode} ({duration:.2f}s){Colors.RESET}\n")
        
    return {
        "name": name,
        "passed": passed,
        "duration": duration,
        "code": result.returncode
    }

def main():
    parser = argparse.ArgumentParser(description="Master Automated Test Runner for Car Service Center")
    parser.add_argument("--all", action="store_true", help="Run all test suites (Unit, Integration, E2E)")
    parser.add_argument("--unit", action="store_true", help="Run Backend Unit Tests only")
    parser.add_argument("--integration", action="store_true", help="Run Backend Integration Tests only")
    parser.add_argument("--backend", action="store_true", help="Run all Backend Tests (Unit + Integration)")
    parser.add_argument("--e2e", action="store_true", help="Run Frontend Playwright E2E Tests only")
    parser.add_argument("--ui", action="store_true", help="Open Playwright interactive UI mode")

    args = parser.parse_args()

    # Default to running all if no specific flag provided
    run_all = args.all or (not args.unit and not args.integration and not args.backend and not args.e2e and not args.ui)

    print_banner("CAR SERVICE CENTER - AUTOMATED TEST SUITE")
    
    results = []

    # 1. Backend Unit Tests
    if run_all or args.unit:
        res = run_step(
            "Backend Unit Tests (Vitest)",
            ["npm", "run", "test:unit"],
            BACKEND_DIR
        )
        results.append(res)

    # 2. Backend Integration Tests
    if run_all or args.integration:
        res = run_step(
            "Backend Integration Tests (Vitest + Supertest)",
            ["npm", "run", "test:integration"],
            BACKEND_DIR
        )
        results.append(res)

    # 3. All Backend Tests (if explicitly selected via --backend)
    if args.backend and not run_all:
        res = run_step(
            "All Backend Tests (Unit + Integration)",
            ["npm", "test"],
            BACKEND_DIR
        )
        results.append(res)

    # 4. Frontend Playwright E2E Tests
    if run_all or args.e2e:
        res = run_step(
            "Frontend E2E Tests (Playwright Chromium)",
            ["npm", "run", "test:e2e"],
            FRONTEND_DIR
        )
        results.append(res)

    # 5. Playwright UI Mode
    if args.ui:
        res = run_step(
            "Playwright UI Mode",
            ["npm", "run", "test:e2e:ui"],
            FRONTEND_DIR
        )
        results.append(res)

    # Print Summary Table
    print_banner("EXECUTION SUMMARY REPORT")
    print(f"{'Test Suite':<45} | {'Duration':<10} | {'Status':<10}")
    print("-" * 72)

    all_passed = True
    total_time = 0.0

    for r in results:
        total_time += r["duration"]
        status_str = f"{Colors.GREEN}PASSED{Colors.RESET}" if r["passed"] else f"{Colors.RED}FAILED{Colors.RESET}"
        print(f"{r['name']:<45} | {r['duration']:>7.2f}s  | {status_str}")
        if not r["passed"]:
            all_passed = False

    print("-" * 72)
    print(f"Total Time Elapsed: {total_time:.2f}s")

    if all_passed:
        print(f"\n{Colors.BOLD}{Colors.GREEN}🎉 ALL TEST SUITES PASSED SUCCESSFULLY (100% PASS RATE)!{Colors.RESET}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.BOLD}{Colors.RED}❌ SOME TEST SUITES FAILED. PLEASE REVIEW THE LOGS ABOVE.{Colors.RESET}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()

