## Copyparty wget

![A screenshot of the plugin UI](/docs/screenshot.png)

An improved plugin to directly download files off the internet onto copyparty.

### How to use

1. Download `wget.js` amd `wget.py`
2. Put wget.js somewhere that can be accessed from the copyparty webserver. (any public volume)
3. Add `--js-browser <mapped path to wget.js> --xm I,<absolute path to wget.py>` or add this to your config file:
```ini
[global]
	js-browser: <volume path to wget.js>
	xm: I,<absolute path to wget.py>
```
> [!NOTE]
> The "mapped path" is the path on the webserver to `wget.js`, so if you have `wget.js` stored in the `/party` folder in your filesystem and `/party` is mapped to `/` in copyparty, `/wget.js` is the mapped path.

4. Restart copyparty
5. Done! :tada:

### Features

- nice UI
- multiple downloads at the same time
- progress indicator
- hidden from users that don't have write permissions
- provides wget error logs when download fails

### TODOs

- [x] provide error logs when wget crashes
- [ ] upgrade to an up2k-like progress bar