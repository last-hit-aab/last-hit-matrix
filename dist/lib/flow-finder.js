"use strict";var __importDefault=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(exports,"__esModule",{value:!0});var fs_1=__importDefault(require("fs")),jsonfile_1=__importDefault(require("jsonfile")),path_1=__importDefault(require("path")),utils_1=require("./utils"),readMatrixJSON=function(t,e,r){var n=path_1.default.join(utils_1.getMatrixFolder(t),e,r+".json");return fs_1.default.existsSync(n)&&fs_1.default.statSync(n).isFile()?jsonfile_1.default.readFileSync(n,{encoding:"UTF-8"}):null},readMatrix=function(t,e){var r=t.story,n=t.flow,i=readMatrixJSON(e,r,n)||[];return 0==i.length?[{story:r,flow:n}]:i.map(function(t){return jsonfile_1.default.writeFileSync(utils_1.getMatrixDataFile(e,r,n,t.key),t,{encoding:"UTF-8",spaces:"\t"}),{story:r,flow:"matrix:"+n+"?"+t.key}})};exports.findFlows=function(r){var n=r.getWorkspace();return fs_1.default.readdirSync(n).filter(function(t){return fs_1.default.statSync(path_1.default.join(n,t)).isDirectory()}).filter(function(t){return![".scripts"].includes(t)}).map(function(e){return fs_1.default.readdirSync(path_1.default.join(n,e)).filter(function(t){return fs_1.default.statSync(path_1.default.join(n,e,t)).isFile()}).filter(function(t){return t.endsWith(".flow.json")}).map(function(t){return t.replace(/^(.*)\.flow\.json$/,"$1")}).filter(function(t){return r.isIncluded(e,t)&&!r.isExcluded(e,t)}).map(function(t){return{story:e,flow:t}}).reduce(function(t,e){return t.push.apply(t,readMatrix(e,r)),t},[])}).reduce(function(t,e){return t.push.apply(t,e),t},[])};