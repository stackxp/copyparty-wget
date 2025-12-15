(() => {
	const contentType = "application/x-www-form-urlencoded;charset=UTF-8"

	if (!has(perms, "write"))
		return

	ebi("opa_cfg").insertAdjacentHTML("afterend", '<a id="opa_wget" href="#v=wget" data-dest="wget">📤</a>')
	QS("head").insertAdjacentHTML("beforeend", '<style>' +
		'#op_wget h2 {margin: 0}' +
		'#op_wget label {display: block}' +
		'#wget_err {display: block; background: var(--bg-d1); border-radius: .3rem; padding: .2rem; height: 8rem; overflow-y: scroll}</style>'
	)
	ebi("op_cfg").insertAdjacentHTML("afterend", '<div id="op_wget" class="opview opbox opwide"></div>')
	let wrapper = ebi("op_wget")
	ebi("opa_wget").onclick = opclick

	function setContent(msg = null, showLinks=false) {
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
		if (showLinks) {
			wrapper.innerHTML += '<p><a href="#" id="wget_retry">Retry</a> / <a href="#" id="wget_new">Download a different file</a></p>'
			ebi("wget_retry").onclick = (e) => {
				ev(e)
				beginDownload()
			}
			ebi("wget_new").onclick = (e) => {
				ev(e)
				setContent()
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
							setContent(
								'The file couldn\'t be downloaded &colon;&lpar;<br>Please check the server log or crash log below for details.<br>'+
								'<p>Wget log:<br><code id="wget_err">' + esc(data.log.join("\n")).replace("\n", "<br>") + '</code></p>',
								true
							)
							break
						default:
							if (data.error)
								setContent("Something went wrong &colon;&lpar;", true)
							break
					}
					if (data.status != "running")
						clearInterval(intId)
				} catch (e) {
					console.error(req.responseText.trim(), e)
					setContent('The server sent an invalid response.', true)
					clearInterval(intId)
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
				setContent('The server sent an invalid response &colon;&lpar;<br>', true)
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
		setContent("Initializing download...")
	}

	setContent()
	if (sread("opmode") == "wget")
		goto("wget")
})()