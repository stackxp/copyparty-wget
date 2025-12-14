(() => {
	const contentType = "application/x-www-form-urlencoded;charset=UTF-8"

	if (!has(perms, "write"))
		return

	ebi("opa_cfg").insertAdjacentHTML("afterend", '<a id="opa_wget" href="#v=wget" data-dest="wget">📤</a>')
	QS("head").insertAdjacentHTML("beforeend", '<style>#op_wget h2 {margin: 0} #op_wget label {display: block}</style>')
	ebi("op_cfg").insertAdjacentHTML("afterend", '<div id="op_wget" class="opview opbox opwide"></div>')
	let wrapper = ebi("op_wget")
	ebi("opa_wget").onclick = opclick

	function setContent(msg = null) {
		wrapper.innerHTML = "<h2>wget downloader</h2>"
		if (msg)
			wrapper.innerHTML += "<p>" + msg + "</p>"
		else {
			wrapper.innerHTML += ('<p>Download a file straight to this folder using wget.</p>' + 
			'<form id="wget_form">' + 
			'<label>Download URL: <input type="text" name="url" placeholder="(required)" autocorrect="off" autocomplete="off" autocapitalize="off" size="32"></label>' + 
			'<label>Filename: <input type="text" name="filename" placeholder="(blank for default)" autocorrect="off" autocomplete="off" autocapitalize="off" size="32"></label>' + 
			'<input type="submit" value="Download">' + 
			'</form>')
			ebi("wget_form").onsubmit = (e) => {
				ev(e)
				let formdata = new FormData(e.target)
				downloadUrl = formdata.get("url")
				downloadName = formdata.get("filename")
				if (!downloadUrl.trim())
					return
				beginDownload()
			}
		}
	}

	let downloadId = null,
		downloadUrl = null,
		downloadName = null

	function updateStatus() {
		let intId = setInterval(() => {
			let req = new XHR()
			req.onload = req.onerror = () => {
				try {
					console.log(req.responseText)
					let data = JSON.parse(req.responseText.trim())
					switch (data.status) {
						case "running":
							setContent('Downloading file... &lpar;' + data.progress + '%&rpar;')
							break
						case "success":
							setContent('The file has been successfully downloaded! &colon;&rpar;')
							location.reload()
							break
						case "error":
							setContent('The file couldn\'t be downloaded &colon;&lpar;<br>Please check the server logs or <a href="#" id="wget_retry">Retry</a>')
							ebi("wget_retry").onclick = (e) => {
								ev(e)
								beginDownload()
							}
							break
					}
					if (data.status != "running")
						clearInterval(intId)
				} catch {
					setContent('Waiting for server response...')
				}
			}
			req.open("POST", get_evpath())
			req.setRequestHeader("Content-Type", contentType)
			req.send('msg={"action": "wget.status", "id": ' + downloadId + '}')
		}, 500)
	}

	function beginDownload() {
		let req = new XHR()
		req.onload = () => {
			downloadId = parseInt(req.responseText.trim())
			if (isNaN(downloadId)) {
				console.error("Got invalid download ID from server", req.responseText)
				setContent('Something went wrong &colon;&lpar;<br>Please check the server logs or <a href="#" id="wget_retry">Retry</a>')
				ebi("wget_retry").onclick = (e) => {
					ev(e)
					beginDownload()
				}
				return
			}
			updateStatus()
		}
		req.open("POST", get_evpath())
		req.setRequestHeader("Content-Type", contentType)
		req.send('msg={"action": "wget.download", "url": "' + downloadUrl + '", "filename": "' + downloadName + '"}')
	}

	setContent()
	if (sread("opmode") == "wget")
		goto("wget")
})()