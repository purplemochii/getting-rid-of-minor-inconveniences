# why-is-this-running

> Something is using my CPU. I did NOT consent.

## Features
- Shows top CPU / RAM hogs
- Shows who started them
- Shows uptime
- Suggests `kill` vs `nice` for remediation

## Installation
```bash
git clone <your-repo-url>
cd why-is-this-running
pip install -r requirements.txt
chmod +x bin/why-is-this-running.sh


## Usage
./bin/why-is-this-running.sh
./bin/why-is-this-running.sh --kill
./bin/why-is-this-running.sh --nice


---

### Quick start

1. Clone repo  
2. Install Python dependencies  
3. Make the bash wrapper executable  
4. Run `./bin/why-is-this-running.sh`  
5. Optional: alias it for convenience

```bash
alias why="~/getting-rid-of-minor-inconveniences/why-is-this-running/bin/why-is-this-running.sh"
