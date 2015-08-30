/**
 * PreloadJS provides a consistent API for preloading content in HTML5.
 * @module PreloadJS
 */

// namespace:
this.createjs = this.createjs||{};

(function() {

	//TODO: Add an API to clear the preloader queue. Handy if we want to reuse it, and don't want the composite progress of finished loads.

	/**
	 * PreloadJS provides a consistent way to preload content for use in HTML applications.
	 * @class PreloadJS
	 * @param {Boolean} useXHR2 Determines whether the preload instance will use XHR (XML HTTP Requests), or fall back on tag loading.
	 * @constructor
	 * @extends AbstractLoader
	 */
	var PreloadJS = function(useXHR2) {
		this.initialize(useXHR2);
	};

	var p = PreloadJS.prototype = new createjs.AbstractLoader();
	var s = PreloadJS;

	// Preload Types
	/**
	 * The preload type for image files, usually png, gif, or jpg/jpeg
	 * @property IMAGE
	 * @type String
	 * @default image
	 * @static
	 */
	s.IMAGE = "image";

	/**
	 * Time in millseconds to assume a load has failed.
	 * @property TIMEOUT_TIME
	 * @type Number
	 * @default 8000
	 * @static
	 */
	s.TIMEOUT_TIME = 8000;

	// Flags
	/**
	 * Use XMLHttpRequest when possible.
	 * @property useXHR
	 * @type Boolean
	 * @default true
	 */
	p.useXHR = true;

	/* //TODO: Implement syncronous behaviour
	 * Use asynchronous XMLHttpRequests.
	 * @property async
	 * @type Boolean
	 * @default false
	 *
	p.useAsync = false;*/

	/**
	 * Stop processing the current queue when an error is encountered.
	 * @property stopOnError
	 * @type Boolean
	 * @default false
	 */
	p.stopOnError = false;

	/**
	 * Ensure loaded scripts "complete" in the order they are specified.
	 * @property maintainScriptOrder
	 * @type Boolean
	 * @default true
	 */
	p.maintainScriptOrder = true;

	/**
	 * The next preload queue to process when this one is complete.
	 * @property next
	 * @type PreloadJS
	 * @default null
	 */
	p.next = null;

	//Protected properties
	p.typeHandlers = null;
	p.extensionHandlers = null;

	p._loadStartWasDispatched = false;
	p._maxConnections = 1;
	p._currentLoads = null;
	p._loadQueue = null;
	p._loadedItemsById = null;
	p._loadedItemsBySrc = null;
	p._targetProgress = 0; // Actual Progress
	//TODO: Progress tweening
	//p._currentProgress = 0; // Progress to Display when tweening
	//p._progressInterval = null;
	p._numItems = 0;
	p._numItemsLoaded = null;
	p._scriptOrder = null;
	p._loadedScripts = null;

	// Browser Capabilities
	p.TAG_LOAD_OGGS = true;

	/**
	 * Initialize a PreloadJS instance
	 * @method initialize
	 * @param {Boolean} useXHR Use XHR (XML HTTP Requests) for loading. When this is false,
	 * PreloadJS will use tag loading when possible. Note that Scripts and CSS require
	 * XHR to load properly.
	 */
	p.initialize = function(useXHR) {
		this._numItems = 0;
		this._numItemsLoaded = 0;
		this._targetProgress = 0;
		this._paused = false;
		this._currentLoads = [];
		this._loadQueue = [];
		this._scriptOrder = [];
		this._loadedScripts = [];
		this._loadedItemsById = {};
		this._loadedItemsBySrc = {};
		this.typeHandlers = {};
		this.extensionHandlers = {};
		this._loadStartWasDispatched = false;

		this.useXHR = (useXHR != false && window.XMLHttpRequest != null);
		this.determineCapabilities();
	};

	/**
	 * Determine the capabilities based on the current browser/version.
	 * @method determineCapabilities
	 * @private
	 */
	p.determineCapabilities = function() {
		var BD = createjs.PreloadJS.BrowserDetect;
		if (BD == null) { return; }
		createjs.PreloadJS.TAG_LOAD_OGGS = BD.isFirefox || BD.isOpera;
			// && (otherConditions)
	}

	/**
	 * Determine if a specific type should be loaded as a binary file
	 * @method isBinary
	 * @param type The type to check
	 * @private
	 */
	s.isBinary = function(type) {
		switch (type) {
			case createjs.PreloadJS.IMAGE:
				return true;
			default:
				return false;
		}
	};

	/**
	 * Register a plugin. Plugins can map to both load types (sound, image, etc), or can map to specific
	 * extensions (png, mp3, etc). Only one plugin can currently exist per suffix/type.
	 * Plugins must return an object containing:
	 *  * callback: The function to call
	 *  * types: An array of types to handle
	 *  * extensions: An array of extensions to handle. This is overriden by type handlers
	 * @method installPlugin
	 * @param {Function} plugin The plugin to install
	 */
	p.installPlugin = function(plugin) {
		if (plugin == null || plugin.getPreloadHandlers == null) { return; }
		var map = plugin.getPreloadHandlers();
		if (map.types != null) {
			for (var i=0, l=map.types.length; i<l; i++) {
				this.typeHandlers[map.types[i]] = map.callback;
			}
		}
		if (map.extensions != null) {
			for (i=0, l=map.extensions.length; i<l; i++) {
				this.extensionHandlers[map.extensions[i]] = map.callback;
			}
		}
	};

	/**
	 * Set the maximum number of concurrent connections.
	 * @method setMaxConnections
	 * @param {Number} value The number of concurrent loads to allow. By default, only a single connection is open at any time.
	 * Note that browsers and servers may have a built-in maximum number of open connections
	 */
	p.setMaxConnections = function (value) {
		this._maxConnections = value;
		if (!this._paused) {
			this._loadNext();
		}
	}

	/**
	 * Load a single file. Note that calling loadFile appends to the current queue, so it can be used multiple times to
	 * add files. Use <b>loadManifest()</b> to add multiple files at onces. To clear the queue first use the <b>close()</b> method.
	 * @method loadFile
	 * @param {Object | String} file The file object or path to load. A file can be either
     * <ol>
     *     <li>a path to a resource (string). Note that this kind of load item will be
     *     converted to an object (next item) in the background.</li>
     *     <li>OR an object that contains:<ul>
     *         <li>src: The source of the file that is being loaded. This property is <b>required</b>. The source can either be a string (recommended), or an HTML tag.</li>
     *         <li>type: The type of file that will be loaded (image, sound, json, etc).
     *         PreloadJS does auto-detection of types using the extension. Supported types are defined on PreloadJS, such as PreloadJS.IMAGE.
	 *         It is recommended that a type is specified when a non-standard file URI (such as a php script) us used.</li>
     *         <li>id: A string indentifier which can be used to reference the loaded object.</li>
     *         <li>data: An arbitrary data object, which is included with the loaded object</li>
     *     </ul>
     * </ol>
	 * @param {Boolean} loadNow Kick off an immediate load (true) or wait for a load call (false). The default value is true. If the queue is paused, and this value
	 * is true, the queue will resume.
	 */
	p.loadFile = function(file, loadNow) {
		if (file == null) {
			this._sendError({text: "File is null."});
			return;
		}
		this._addItem(file);

		if (loadNow !== false) {
			this.setPaused(false);
		}
	}

	/**
	 * Load a manifest. This is a shortcut method to load a group of files. To load a single file, use the loadFile method.
	 * Note that calling loadManifest appends to the current queue, so it can be used multiple times to add files. To clear
	 * the queue first, use the <b>close()</b> method.
	 * @method loadManifest
	 * @param {Array} manifest The list of files to load. Each file can be either
	 * <ol>
	 *     <li>a path to a resource (string). Note that this kind of load item will be
	 *     converted to an object (next item) in the background.</li>
	 *     <li>OR an object that contains:<ul>
	 *         <li>src: The source of the file that is being loaded. This property is <b>required</b>.
	 *         The source can either be a string (recommended), or an HTML tag. </li>
	 *         <li>type: The type of file that will be loaded (image, sound, json, etc).
	 *         PreloadJS does auto-detection of types using the extension. Supported types are defined on PreloadJS, such as PreloadJS.IMAGE.
	 *         It is recommended that a type is specified when a non-standard file URI (such as a php script) us used.</li>
	 *         <li>id: A string indentifier which can be used to reference the loaded object.</li>
	 *         <li>data: An arbitrary data object, which is included with the loaded object</li>
	 *     </ul>
	 * </ol>
	 * @param {Boolean} loadNow Kick off an immediate load (true) or wait for a load call (false). The default value is true. If the queue is paused, and this value
	 * is true, the queue will resume.
	 */
	p.loadManifest = function(manifest, loadNow) {
		var data;

		if (manifest instanceof Array) {
			if (manifest.length == 0) {
				this._sendError({text: "Manifest is empty."});
				return;
			}
			data = manifest;
		} else {
			if (manifest == null) {
				this._sendError({text: "Manifest is null."});
				return;
			}
			data = [manifest];
		}

		for (var i=0, l=data.length; i<l; i++) {
			this._addItem(data[i], false);
		}

		if (loadNow !== false) {
			this._loadNext();
		}
	};

	/**
	 * Begin loading the queued items.
	 * @method load
	 */
	p.load = function() {
		this.setPaused(false);
	};

	/**
	 * Lookup a loaded item using either the "id" or "src" that was specified when loading it.
	 * @method getResult
	 * @param {String} value The "id" or "src" of the loaded item.
	 * @return {Object} A result object containing the contents of the object that was initially requested using loadFile or loadManifest, including:
     * <ol>
     *     <li>src: The source of the file that was requested.</li>
     *     <li>type: The type of file that was loaded. If it was not specified, this is auto-detected by PreloadJS using the file extension.</li>
     *     <li>id: The id of the loaded object. If it was not specified, the ID will be the same as the "src" property.</li>
     *     <li>data: Any arbitrary data that was specified, otherwise it will be undefined.
	 *     <li>result: The loaded object. PreloadJS provides usable tag elements when possible:<ul>
	 *          <li>An HTMLImageElement tag (&lt;image /&gt;) for images</li>
	 *          <li>An HTMLAudioElement tag (&lt;audio &gt;) for audio</li>
	 *          <li>A script tag for JavaScript (&lt;script&gt;&lt;/script&gt;)</li>
	 *          <li>A style tag for CSS (&lt;style&gt;&lt;/style&gt;)</li>
	 *          <li>Raw text for JSON or any other kind of loaded item</li>
	 *     </ul></li>
     * </ol>
     * This object is also returned via the "onFileLoad" callback, although a "target" will be included, which is a reference to the PreloadJS instance.
	 */
	p.getResult = function(value) {
		return this._loadedItemsById[value] || this._loadedItemsBySrc[value];
	};

	/**
	 * Pause or resume the current load. The active item will not cancel, but the next
	 * items in the queue will not be processed.
	 * @method setPaused
	 * @param {Boolean} value Whether the queue should be paused or not.
	 */
	p.setPaused = function(value) {
		this._paused = value;
		if (!this._paused) {
			this._loadNext();
		}
	};

	/**
	 * Close the active queue. Closing a queue completely empties the queue, and prevents any remaining items from starting to
	 * download. Note that currently there any active loads will remain open, and events may be processed.<br/><br/>
	 * To stop and restart a queue, use the <b>setPaused(true|false)</b> method instead.
	 * @method close
	 */
	p.close = function() {
		while (this._currentLoads.length) {
			this._currentLoads.pop().cancel();
		}
		this._scriptOrder.length = 0;
		this._loadedScripts.length = 0;
	};


//Protected Methods
	p._addItem = function(item) {
		var loadItem = this._createLoadItem(item);
		if (loadItem != null) {
			this._loadQueue.push(loadItem);

			this._numItems++;
			this._updateProgress();
		}
	};

	p._loadNext = function() {
		if (this._paused) { return; }

		if (!this._loadStartWasDispatched) {
			this._sendLoadStart();
			this._loadStartWasDispatched = true;
		}

		if (this._numItems == this._numItemsLoaded) {
			this.loaded = true;
			this._sendComplete();
			if (this.next && this.next.load) {
				//LM: Do we need to apply here?
				this.next.load.apply(this.next);
			}
		}

		while (this._loadQueue.length && this._currentLoads.length < this._maxConnections) {
			var loadItem = this._loadQueue.shift();
			this._loadItem(loadItem);
		}
	};

	p._loadItem = function(item) {
		item.onProgress = createjs.PreloadJS.proxy(this._handleProgress, this);
		item.onComplete = createjs.PreloadJS.proxy(this._handleFileComplete, this);
		item.onError = createjs.PreloadJS.proxy(this._handleFileError, this);

		this._currentLoads.push(item);

		item.load();
	};

	p._handleFileError = function(event) {
		var loader = event.target;

		var resultData = this._createResultData(loader.getItem());
		this._numItemsLoaded++;
		this._updateProgress();

		this._sendError(resultData);

		if (!this.stopOnError) {
			this._removeLoadItem(loader);
			this._loadNext();
		}
	};

	p._createResultData = function(item) {
		var resultData = {id:item.id, result:null, data:item.data, type:item.type, src:item.src};
		this._loadedItemsById[item.id] = resultData;
		this._loadedItemsBySrc[item.src] = resultData;
		return resultData;
	};

	p._handleFileComplete = function(event) {
		var loader = event.target;
		var item = loader.getItem();
		var resultData = this._createResultData(item);

		this._removeLoadItem(loader);

		//Convert to proper tag ... if we need to.
		if (loader instanceof createjs.XHRLoader) {
			resultData.result = this._createResult(item, loader.getResult());
		} else {
			resultData.result = item.tag;
		}

		//TODO: Move tag creation to XHR?
		switch (item.type) {
			case createjs.PreloadJS.IMAGE: //LM: Consider moving this to XHRLoader
				if(loader instanceof createjs.XHRLoader) {
					var _this = this; // Use closure workaround to maintain reference to item/result
					resultData.result.onload = function(event) {
						_this._handleFileTagComplete(item, resultData);
					}
					return;
				}
				break;
		}

		this._handleFileTagComplete(item, resultData);
	};

	p._checkScriptLoadOrder = function () {
		var l = this._loadedScripts.length;

		for (var i=0;i<l;i++) {
			var order = this._loadedScripts[i];
			if (order === null) { break; }
			if (order === true) { continue; }

			var item = this.getResult(order.src);
            var resultData = this.getResult(order.id);
            resultData.result = item.result;
			this._handleFileTagComplete(item, resultData);
			this._loadedScripts[i] = true;

			i--;
			l--;
		}
	};

	p._handleFileTagComplete = function(item, resultData) {
		this._numItemsLoaded++;

		if (item.completeHandler) {
			item.completeHandler(resultData);
		}

		this._updateProgress();
		this._sendFileComplete(resultData);

		this._loadNext();
	};

	p._removeLoadItem = function(loader) {
		var l = this._currentLoads.length;
		for (var i=0;i<l;i++) {
			if (this._currentLoads[i] == loader) {
				this._currentLoads.splice(i,1); break;
			}
		}
	};

	p._createResult = function(item, data) {
		var tag = null;
		var resultData;
		switch (item.type) {
			case createjs.PreloadJS.IMAGE:
				tag = this._createImage(); break;
		}

		return tag;
	};

	// This is item progress!
	p._handleProgress = function(event) {
		var loader = event.target;
		var resultData = this._createResultData(loader.getItem());
		resultData.progress = loader.progress;
		this._sendFileProgress(resultData);
		this._updateProgress();
	};

	p._updateProgress = function () {
		var loaded = this._numItemsLoaded / this._numItems; // Fully Loaded Progress
		var remaining = this._numItems-this._numItemsLoaded;
		if (remaining > 0) {
			var chunk = 0;
			for (var i=0, l=this._currentLoads.length; i<l; i++) {
				chunk += this._currentLoads[i].progress;
			}
			loaded += (chunk / remaining) * (remaining/this._numItems);
		}
		this._sendProgress({loaded:loaded, total:1});
	}

	p._createLoadItem = function(loadItem) {
		var item = {};

		// Create/modify a load item
		switch(typeof(loadItem)) {
			case "string":
				item.src = loadItem; break;
			case "object":
				item = loadItem;
				break;
			default:
				break;
		}

		// Get source extension
		item.ext = this._getNameAfter(item.src, ".");
		if (!item.type) {
			item.type = this.getType(item.ext)
		}
		//If there's no id, set one now.
		if (item.id == null || item.id == "") {
			//item.id = this._getNameAfter(item.src, "/");
            item.id = item.src; //[SB] Using the full src is more robust, and more useful from a user perspective.
		}

		// Give plugins a chance to modify the loadItem
		var customHandler = this.typeHandlers[item.type] || this.extensionHandlers[item.ext];
		if (customHandler) {
			var result = customHandler(item.src, item.type, item.id, item.data);
			//Plugin will handle the load, so just ignore it.
			if (result === false) {
				return null;

			// Load as normal
			} else if (result === true) {
				// Do Nothing
			// Result is a loader class
			} else {
				if (result.src != null) { item.src = result.src; }
				if (result.id != null) { item.id = result.id; }
				if (result.tag != null && result.tag.load instanceof Function) { //Item has what we need load
					item.tag = result.tag;
				}
			}

			// Update the extension in case the type changed
			item.ext = this._getNameAfter(item.src, ".");
		}

		var useXHR2 = this.useXHR;

		if (this.useXHR == true && (item.type == createjs.PreloadJS.IMAGE)) {
			var loader = this._createTagItem(item);
			loader.useXHR = true;
			return loader;
		}

		if (useXHR2) {
			return new createjs.XHRLoader(item);
		} else if (!item.tag) {
			return this._createTagItem(item);
		} else {
			return new createjs.TagLoader(item);
		}
	};

	p._createTagItem = function (item) {
		var tag;
		var srcAttr = "src";
		var useXHR = false;

		//Create TagItem
		switch(item.type) {
			case createjs.PreloadJS.IMAGE:
				tag = this._createImage();
				break;
			default:
		}

		item.tag = tag;
		return new createjs.TagLoader(item, srcAttr, useXHR);
	};

	p.getType = function(ext) {
		switch (ext) {
			case "jpeg":
			case "jpg":
			case "gif":
			case "png":
				return createjs.PreloadJS.IMAGE;
			default:
		}
	};

	p._getNameAfter = function(path, token) {
		var dotIndex = path.lastIndexOf(token);
		var lastPiece = path.substr(dotIndex+1);
		var endIndex = lastPiece.lastIndexOf(/[\b|\?|\#|\s]/);
		return (endIndex == -1) ? lastPiece : lastPiece.substr(0, endIndex);
	};

	p._createImage = function() {
		return document.createElement("img");
	};

	p.toString = function() {
		return "[PreloadJS]";
	};

// Static methods
	/**
	 * A function proxy for PreloadJS methods. By default, JavaScript methods do not maintain scope, so passing a
	 * method as a callback will result in the method getting called in the scope of the caller. Using a proxy
	 * ensures that the method gets called in the correct scope. All internal callbacks in PreloadJS use this approach.
	 * @method proxy
	 * @param {Function} method The function to call
	 * @param {Object} scope The scope to call the method name on
	 * @static
	 * @private
	 */
	s.proxy = function(method, scope) {
		return function(event) {
			return method.apply(scope, arguments);
		};
	}

	createjs.PreloadJS = PreloadJS;

	/**
	 * An additional module to determine the current browser, version, operating system, and other environmental variables.
	 */
	var BrowserDetect = function() {}

	BrowserDetect.init = function() {
		var agent = navigator.userAgent;
		BrowserDetect.isFirefox = (agent.indexOf("Firefox")> -1);
		BrowserDetect.isOpera = (window.opera != null);
		BrowserDetect.isIOS = agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1;
	}

	BrowserDetect.init();

	createjs.PreloadJS.BrowserDetect = BrowserDetect;

}());

