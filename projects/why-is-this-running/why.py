#!/usr/bin/env python3

import psutil
import argparse
import time
from datetime import timedelta

def list_top_processes(limit = 10):
    processes = []

    for p in psutil.process_iter(['pid', 'ppid', 'name', 'cpu_percent', 'memory_percent', "create_time"]):
        try:
            processes.append(p.info)
        except psutil.NoSuchProcess:
            continue
    
    processes.sort(key = lambda x: x['cpu_percent'], reverse = True)
    return processes[:limit]


def format_process(proc):
    elapsed = str(timedelta(seconds = int(time.time() - proc['create_time'])))
    return f"{proc['pid']: > 5} | {proc['name'][:20]: < 20} | CPU: {proc['cpu_percent']: > 5}% | RAM: {proc['memory_percent']: > 5.1f}% | uptime: {elapsed}"


def main():
    parser = argparse.ArgumentParser(description = "Show top CPU/RAM hogs and suggest actions")
    parser.add_argument("--kill", action = "store_true", help = "Kill the top CPU/RAM hogs")
    parser.add_argument("--nice", action = "store_true", help = "Lower the priority of the top CPU/RAM hogs")

    args = parser.parse_args()

    procs = list_top_processes()
    for proc in procs:
        line = format_process(proc)
        if args.kill:
            line += f" -> kill {proc['pid']}"
        elif args.nice:
            line += f" -> nice -n 10 {proc['pid']}"
        print(line)

    # top offenders
    if procs:
        top = procs[0]
        print(f"\nTop offender: {format_process(top)}")
        print(f"Started py PID: {top['ppid']}, Usr: {psutil.Process(top['pid']).username()}")
        print("suggestion:", 
            "-> nice -n 10" if args.nice 
                else "-> kill -15" 
            if args.kill 
                else "-> watch/observe")

if __name__ == "__main__":
    main()
       
