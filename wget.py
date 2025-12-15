import json, subprocess, threading, re

_processes = {}

def _update_progress(proc_id : int):
	proc = _processes[proc_id]["process"]
	while proc.poll() == None:
		line = proc.stderr.readline().decode().strip() # Don't ask me why wget outputs status info to stderr
		_processes[proc_id]["log"] += [line]
		prog_match = re.match(r".* ([0-9]+)% .*", line)
		if prog_match:
			_processes[proc_id]["progress"] = int(prog_match.group(1))

	_processes[proc_id]["status"] = "error" if proc.returncode else "success"
	print("-- Finished download ID", proc_id, "with return code", proc.returncode)

def main(args : dict):
	try:
		cmd = json.loads(args["txt"])
	except:
		return
	action = cmd.get("action")

	# Download action
	if action == "wget.download" and "url" in cmd:
		if "w" not in args["perms"]:
			return
		
		# Replace all spaces so it counts as one argument in the command
		proc_cmd = ["wget", cmd.get("url").replace(" ", "%20"), "-P", args["ap"]]
		filename = cmd.get("filename")
		if filename:
			proc_cmd += ["-O", filename]
		
		# Create new process entry
		proc_id = len(_processes)
		_processes[proc_id] = {
			"process": subprocess.Popen(proc_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE),
			"progress": 0,
			"status": "running",
			"log": [],
			"user": args["user"]
		}
		threading.Thread(target=_update_progress, args=(proc_id, )).start()
		print("-- Started download with ID", proc_id, "to", args["ap"])

		# Return process ID
		return {"stdout": str(proc_id)}
	
	# Status action
	if action == "wget.status" and "id" in cmd:
		proc_id = cmd.get("id")
		proc = _processes.get(proc_id)
		if not proc or proc["user"] != args["user"]:
			return {"stdout": '{"error": "can\'t access download"}'}
		
		# Clear process data after being queried once
		if proc["status"] != "running":
			_processes.pop(proc_id)
		
		return {
			"stdout": json.dumps({
			"progress": proc["progress"],
			"status": proc["status"],
			"log": proc["log"]}
		)}