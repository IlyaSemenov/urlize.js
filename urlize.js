var urlize = (function () {

function startswith(string, prefix) {
    return string.substr(0, prefix.length) == prefix;
}

function endswith(string, suffix) {
    return string.substr(string.length - suffix.length, suffix.length) == suffix;
}

// http://stackoverflow.com/a/7924240/17498
function occurrences(string, substring) {
    var n = 0;
    var pos = 0;
    while (true) {
        pos = string.indexOf(substring, pos);
        if (pos != -1) { 
	    n++; 
	    pos += substring.length;
	} else{
	    break;
	}
    }
    return n;
}

var unquoted_percents_re = /%(?![0-9A-Fa-f]{2})/;

// Quotes a URL if it isn't already quoted.
function smart_urlquote(url) {
    // XXX: Not handling IDN.
    // 
    // An URL is considered unquoted if it contains no % characters or
    // contains a % not followed by two hexadecimal digits.
    if (url.indexOf('%') == -1 || url.match(unquoted_percents_re)) {
	return encodeURI(url);
    } else {
	return url;
    }
}

var trailing_punctuation = ['.', ',', ':', ';'];
var wrapping_punctuation = [['(', ')'], ['<', '>'], ['&lt;', '&gt;']];
var word_split_re = /(\s+)/;
var simple_url_re = /^https?:\/\/\w/;
var simple_url_2_re = /^www\.|^(?!http)\w[^@]+\.(com|edu|gov|int|mil|net|org)$/;
var simple_email_re = /^\S+@\S+\.\S+$/;

function urlize(text, nofollow) {
    var trim_url_limit = undefined;
    function trim_url (x, limit) {
	if (limit === undefined)
	    limit = trim_url_limit;
	if (limit && x.length > limit)
		return x.substr(0, limit - 3) + '...';
	return x;
    }
    var autoescape = false;
    var safe_input = false;
    var words = text.split(word_split_re);
    for (var i = 0; i < words.length; i++) { 
	var word = words[i];
	var match = undefined;
	if (word.indexOf('.') != -1 ||
	    word.indexOf('@') != -1 ||
	    word.indexOf(':') != -1) {
	    // Deal with punctuation.
	    var lead = '';
	    var middle = word;
	    var trail = '';
	    for (var j = 0; j < trailing_punctuation.length; j++) {
		var punctuation = trailing_punctuation[j];
		if (endswith(middle, punctuation)) {
		    middle = middle.substr(0, middle.length - punctuation.length);
		    trail = punctuation + trail;
		}
	    }
	    for (var j = 0; j < wrapping_punctuation.length; j++) {
		var opening = wrapping_punctuation[j][0];
		var closing = wrapping_punctuation[j][1];
		if (startswith(middle, opening)) {
		    middle = middle.substr(opening.length);
		    lead = lead + opening;
		}
		// Keep parentheses at the end only if they're balanced.
		if (endswith(middle, closing) &&
		    occurrences(middle, closing) == occurrences(middle, opening) + 1) {
		    middle = middle.substr(0, middle.length - closing.length);
		    trail = closing + trail;
		}
	    }

	    // Make URL we want to point to.
	    var url = undefined;
	    var nofollow_attr = nofollow ? ' rel="nofollow"' : '';
	    if (middle.match(simple_url_re))
		url = smart_urlquote(middle);
	    else if (middle.match(simple_url_2_re))
		url = smart_urlquote('http://' + middle);
	    else if (middle.indexOf(':') == -1 && middle.match(simple_email_re)) {
		// XXX: Not handling IDN.
		url = 'mailto:' + middle;
		nofollow_attr = ''
	    }
	    if (url) {
		var trimmed = trim_url(middle);
		// XXX: Assuming autoscape == false
		middle = '<a href="' + url + '"' + nofollow_attr + '>' + trimmed + '</a>';
		words[i] = lead + middle + trail;
	    } else {
		// XXX: Assuming safe_input == false && autoscape == false.
	    }
	}
	// XXX: Assuming safe_input == false && autoscape == false.
    }
    return words.join('');
}

return urlize;
})();