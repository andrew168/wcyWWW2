var DomUtility = (function () {
    "use strict";
    return {
        createElement: createElement,
        showElements: showElements,
        showElementAsTable: showElementAsTable,
        showElement: showElement,
        closeElements: closeElements,
        closeElement: closeElement,
        hideElements: hideElements,
        hideElement: hideElement,
        createButtonInTableRow: createButtonInTableRow,
        createButtonInTable: createButtonInTable,
        createButton: createButton
    };

    function createElement(parent, tag, id, eleClass) {
        var ele = document.createElement(tag);
        ele.setAttribute('id', id);
        ele.style.visibility = 'hidden';

        if (eleClass) {
            ele.className = eleClass;
        }

        if (parent) {
            parent.appendChild(ele);
        }

        return ele;
    }

    function createButton(parent, id, eleClass, text, onClick, onTouchStart) {
        var BUTTON_TAG = 'button';
        var ele = createElement(parent, BUTTON_TAG, id, eleClass);
        ele.innerText = text;
        if (onTouchStart) {
            ele.addEventListener("touchstart", onTouchStart, true); // act as soon as captured
        } else if (onClick) {
            ele.addEventListener("click", onClick, true);
        }
        ele.style.display = 'inline';
        return ele;
    }

    function createButtonInTable(parent, id, eleClass, text, callback) {
        var cell = createElement(parent, 'tr', id + '-cell', null);
        return createButton(cell, id, eleClass, text, callback);
    }

    function createButtonInTableRow(parent, id, eleClass, text, onClick, onTouchStart) {
        var cell = createElement(parent, 'td', id + '-cell', null);
        return createButton(cell, id, eleClass, text, onClick, onTouchStart);
    }

    function hideElement(ele) {
        ele.style.visibility = 'hidden';
        ele.style.display = 'none';
    }

    function hideElements(eles) {
        for (var i = eles.length - 1; i >= 0; i--) {
            hideElement(eles[i]);
        }
    }

    function closeElement(ele) {
        ele.setAttribute('style', '');
        ele.style.cssText = '';
        ele.style.display = 'none';
        ele.style.visibility = 'hidden';
    }

    function closeElements(eles) {
        for (var i = eles.length - 1; i >= 0; i--) {
            closeElement(eles[i]);
        }
    }

    function showElement(ele) {
        ele.style.visibility = 'visible';
        ele.style.display = 'block';
    }

    function showElementAsTable(ele) {
        ele.style.visibility = 'visible';
        ele.style.display = 'table';
    }

    function showElements(eles) {
        for (var i = eles.length - 1; i >= 0; i--) {
            showElement(eles[i]);
        }
    }
})();
