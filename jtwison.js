window.storyFormat({
    "name": "JTwison",
    "version": "0.0.1",
    "author": "Jason Francis",
    "description": "Export your Twine 2 story as a JSON document",
    "proofing": false,
    "source": "<html>\r\n  <head>\r\n    <title>{{STORY_NAME}}</title>\r\n    <script type=\"text/javascript\">\r\n      /**\r\n       * Twison - Twine 2 JSON Export Story Format\r\n       *\r\n       * Copyright (c) 2015 Em Walker\r\n       * https://lazerwalker.com\r\n       *\r\n       * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and\r\n       * associated documentation files (the \"Software\"), to deal in the Software without restriction,\r\n       * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,\r\n       * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,\r\n       * subject to the following conditions:\r\n       *\r\n       * The above copyright notice and this permission notice shall be included in all copies or substantial\r\n       * portions of the Software.\r\n       *\r\n       * THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT\r\n       * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.\r\n       * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\r\n       * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE\r\n       * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\r\n       */\r\n

var JTwison = {

  /**
   * Extract the link entities from the provided text.
   *
   * Text containing [[foo]] would yield a link named "foo" pointing to the
   * "foo" passage.
   * Text containing [[foo->bar]] would yield a link named "foo" pointing to the
   * "bar" passage.
   *
   * @param {String} text
   *   The text to examine.
   *
   * @return {Array|null}
   *   The array of link objects, containing a `name` and a `link`.
   */
  extractLinksFromText: function(text) {
    var links = text.match(/\[\[.+?\]\]/g);
    if (!links) {
      return null;
    }

    return links.map(function(link) {
      var differentName = link.match(/\[\[(.*?)\-\&gt;(.*?)\]\]/);
      if (differentName) {
        // [[name->link]]
        return {
          name: differentName[1],
          link: differentName[2]
        };
      } else {
        // [[link]]
        link = link.substring(2, link.length-2)
        return {
          name: link,
          link: link
        }
      }
    });
  },

  /**
   * Extract the prop entities from the provided text.
   *
   * A provided {{foo}}bar{{/foo}} prop would yield an object of `{"foo": 'bar'}`.
   * Nested props are supported by nesting multiple {{prop}}s within one
   * another.
   *
   * @param {String} text
   *   The text to examine.
   *
   * @return {Object|null}
   *   An object containing all of the props found.
   */
  extractPropsFromText: function(text) {
    var props = {};
    var propMatch;
    var matchFound = false;
    const propRegexPattern = /\{\{((\s|\S)+?)\}\}((\s|\S)+?)\{\{\/\1\}\}/gm;

    while ((propMatch = propRegexPattern.exec(text)) !== null) {
      // The "key" of the prop, AKA the value wrapped in {{ }}.
      const key = propMatch[1];

      // Extract and sanitize the actual value.
      // This will remove any new lines.
      const value = propMatch[3].replace(/(\r\n|\n|\r)/gm, '');

      // We can nest props like so: {{foo}}{{bar}}value{{/bar}}{{/foo}},
      // so call this same method again to extract the values further.
      const furtherExtraction = this.extractPropsFromText(value);

      if (furtherExtraction !== null) {
        props[key] = furtherExtraction;
      } else {
        props[key] = value;
      }

      matchFound = true;
    }

    if (!matchFound) {
      return null;
    }

    return props;
  },

  /**
   * Convert an entire passage.
   *
   * @param {Object} passage
   *   The passage data HTML element.
   *
   * @return {Object}
   *   Object containing specific passage data. Examples include `name`, `pid`,
   *   `position`, etc.
   */
  convertPassage: function(passage) {
  	var dict = {text: passage.innerHTML};

    
    var links = JTwison.extractLinksFromText(dict.text);
    if (links) {
      dict.links = links;
    }

    dict.sanitized = sanitizeText(dict.text, links)

    const props = JTwison.extractPropsFromText(dict.text);
    if (props) {
      dict.props = props;
    }

    ["name", "pid", "position", "tags"].forEach(function(attr) {
      var value = passage.attributes[attr].value;
      if (value) {
        dict[attr] = value;
      }
    });

    if(dict.position) {
      var position = dict.position.split(',')
      dict.position = {
        x: position[0],
        y: position[1]
      }
    }

    if (dict.tags) {
      dict.tags = dict.tags.split(" ");
    }

    return dict;
	},

  /**
   * Remove the links from the text
   *
   * @return {String}
   *   String containing the text with the links and hooks removed
   */
   sanitizeText: function(passageText, links) {
    links.forEach((link) => {
        passageText = passageText.replace(link.original, '');
    });
    return passageText.trim();
},

  /**
   * Convert an entire story.
   *
   * @param {Object} story
   *   The story data HTML element.
   *
   * @return {Object}
   *   Object containing processed "passages" of data.
   */
  convertStory: function(story) {
    var passages = story.getElementsByTagName("tw-passagedata");
    var convertedPassages = Array.prototype.slice.call(passages).map(JTwison.convertPassage);

    var dict = {
      passages: convertedPassages
    };

    ["name", "startnode", "creator", "creator-version", "ifid"].forEach(function(attr) {
      var value = story.attributes[attr].value;
      if (value) {
        dict[attr] = value;
      }
    });

    // Add PIDs to links
    var pidsByName = {};
    dict.passages.forEach(function(passage) {
      pidsByName[passage.name] = passage.pid;
    });

    dict.passages.forEach(function(passage) {
      if (!passage.links) return;
      passage.links.forEach(function(link) {
        link.pid = pidsByName[link.link];
        if (!link.pid) {
          link.broken = true;
        }
      });
    });

    return dict;
  },

  /**
   * The entry-point for converting Twine data into the Twison format.
   */
  convert: function() {
    var storyData = document.getElementsByTagName("tw-storydata")[0];
    var json = JSON.stringify(JTwison.convertStory(storyData), null, 2);
    document.getElementById("output").innerHTML = json;
  }
}

window.JTwison = JTwison;
\r\n    </script>\r\n  </head>\r\n  <body>\r\n    <pre id=\"output\"></pre>\r\n    <div id=\"storyData\" style=\"display: none;\">\r\n      {{STORY_DATA}}\r\n    </div>\r\n    <script>\r\n      Twison.convert();\r\n    </script>\r\n  </body>\r\n</html>\r\n"
});