window.storyFormat({
	"name": "JTwison",
	"version": "0.1.0",
	"author": "Jason Francis",
	"description": "Export your Twine 2 story as a JSON document, based on Twison",
	"proofing": false,
	"source": "<html>\r\n  
		<head>\r\n    
		<title>{{STORY_NAME}}</title>\r\n    
		<script type=\"text/javascript\">\r\n      
		/**\r\n       * JTwison - Twine 2 JSON Export Story Format\r\n       *\r\n       * Copyright (c) 2021 Jason Francis\r\n       * https://github.com/bl-msch-c220-s22\r\n       *\r\n       * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and\r\n       * associated documentation files (the \"Software\"), to deal in the Software without restriction,\r\n       * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,\r\n       * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,\r\n       * subject to the following conditions:\r\n       *\r\n       * The above copyright notice and this permission notice shall be included in all copies or substantial\r\n       * portions of the Software.\r\n       *\r\n       * THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT\r\n       * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.\r\n       * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\r\n       * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE\r\n       * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\r\n       */\r\n      
		var JTwison={
			extractLinksFromText:function(t){
				var n = t.match(/\\[\\[.+?\\]\\]/g);
				return n?n.map(function(t){
					var n = t.match(/\\[\\[(.*?)\\-\\&gt;(.*?)\\]\\]/);
					return n?{name:n[1],link:n[2]}:(t=t.substring(2,t.length-2),{name:t,link:t})
				}):null
			},
			extractPropsFromText:function(t){ 
				var n,r={},e=!1;
				const a=/\\{\\{((\\s|\\S)+?)\\}\\}((\\s|\\S)+?)\\{\\{\\/\\1\\}\\}/gm;
				for(;null!==(n=a.exec(t));){
					const o=n[1],s=n[3].replace(/(\\r\\n|\\n|\\r)/gm,\"\"),i=this.extractPropsFromText(s);
					r[o]=null!==i?i:s,e=!0}return e?r:null
				},
			convertPassage:function(t){
				var n={text:t.innerHTML},r=JTwison.extractLinksFromText(n.text);
				r&&(n.links=r);
				const e=JTwison.extractPropsFromText(n.text);
				if(e&&(n.props=e),[\"name\",\"pid\",\"position\",\"tags\"].forEach(function(r){var e=t.attributes[r].value;e&&(n[r]=e)}),n.position){
					var a=n.position.split(\",\");
					n.position={x:a[0],y:a[1]}
				}
				return n.tags&&(n.tags=n.tags.split(\" \")),n}
			,convertStory:function(t){
				var n=t.getElementsByTagName(\"tw-passagedata\"),r=Array.prototype.slice.call(n).map(JTwison.convertPassage),e={passages:r};
				[\"name\",\"startnode\",\"creator\",\"creator-version\",\"ifid\"].forEach(function(n){
					var r=t.attributes[n].value;r&&(e[n]=r)});
					var a={};
					return e.passages.forEach(function(t){
						a[t.name]=t.pid
					}),e.passages.forEach(function(t){
						t.links&&t.links.forEach(function(t){
							t.pid=a[t.link],t.pid||(t.broken=!0)
						})
					}),e
				}
			,convert:function(){
				var t=document.getElementsByTagName(\"tw-storydata\")[0],n=JSON.stringify(JTwison.convertStory(t),null,2);
				n = n + document.getElementsByTagName(\"tw-storydata\")[0].outerHTML;
				document.getElementById(\"output\").innerHTML=n
			}
			};
			window.JTwison=JTwison;\r\n    </script>\r\n  </head>\r\n  <body>\r\n    <pre id=\"output\"></pre>\r\n    <div id=\"storyData\" style=\"display: none;\">\r\n      {{STORY_DATA}}\r\n    </div>\r\n    <script>\r\n      JTwison.convert();\r\n    </script>\r\n  </body>\r\n</html>\r\n"
  });