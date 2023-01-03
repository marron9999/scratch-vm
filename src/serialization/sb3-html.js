const Variable = require('../engine/variable');
const formatMessage = require('format-message');
const btoa = require('btoa');

const core = [ 'argument', 'colour', 'control', 'data', 'event', 'looks',
        'math', 'motion', 'operator', 'procedures', 'sensing', 'sound' ];

const debug = false;
//const debug = true;

const formatArgument = function (args, arg_b, arg_s, arg_t, arg_v, arg_i, arg_n) {
	if(args.textonly) return arg_v;
    let arg_c = '';
    arg_s = arg_s.toLowerCase();
    if(arg_b != null) arg_c = detectTextColor(args, arg_b);
    if(arg_c != '') arg_c = ' style="border-color:' + arg_c + ';"';

    let info = '<sup class=debug>' + arg_s + '/' + arg_t + '/' + arg_t + '/' + arg_n;
    if(arg_b != null) {
        info += '/op:' + arg_b.opcode;
    }
    if(arg_i != undefined) {
        if(arg_i.indexOf('list') > 1) {
            info += '/i:list';
        } else if(arg_i.indexOf('broadcast') > 1) {
            info += '/i:broadcast';
        } else if(arg_i.indexOf('variable') > 1) {
            info += '/i:variable';
        }
        if(arg_i.indexOf('dropdown') > 1) {
            info += '/i:dropdown';
        }
    }
    if(!debug) info = ''; else info += '</sup>';

	if(arg_v == "") arg_v = "<span class=l0></span>";

    if(arg_t == 'menu') {
        if(arg_v.indexOf('<span class=r1') == 0) return arg_v;
        return '<span class=b2' + /*arg_c +*/ '>'
                + info + arg_v + '</span>';
    }

    if(arg_b != null) {
        let eicon = detectExtIcon(args, arg_b);
        if(eicon != null)
            arg_v = span_icon16(eicon + ' lsz0 rsz1') + arg_v;
        if(args.infos[arg_b.opcode] != undefined
        && args.infos[arg_b.opcode].msg != undefined
        && args.infos[arg_b.opcode].msg == '%1') return arg_v;
        if(arg_b.opcode == 'procedures_prototype')
            return '<span class=b2' + arg_c + '>'
                    + info + arg_v + '</span>';
        if(arg_s == 'boolean') {
            return '<span class=o><span class=c1' + arg_c + '>'
                    + info + arg_v + '</span></span>';
        }
        return '<span class=o><span class=r1' + arg_c + '>'
                + info + arg_v + '</span></span>';
    }

    if(arg_s == 'boolean') {
        return '<span class=o><span class=c1' + arg_c + '>'
                + info + arg_v + '</span></span>';
    }
    if(arg_s == 'reporter') {
        return '<span class=o><span class=r1' + arg_c + '>'
                + info + arg_v + '</span></span>';
    }

    if(arg_i != undefined) {
        if(arg_i.indexOf('list') > 1) {
            return '<span class=b1' + arg_c + '>'
                    + info + arg_v + '</span>';
        }
        if(arg_i.indexOf('broadcast') > 1) {
            return '<span class=b2' + arg_c + '>'
                    + info + arg_v + '</span>';
        }
        if(arg_i.indexOf('variable') > 1) {
            return '<span class=r1' + arg_c + '>'
                    + info + arg_v + '</span>';
        }
        if(arg_i.indexOf('dropdown') > 1) {
            return '<span class=b2' + arg_c + '>'
                    + info + arg_v + '</span>';
        }
    }
    if(arg_n == 'COLOR'
    || arg_n == 'COLOR2'
    || arg_n == 'COLOUR') {
        arg_v = span_color(arg_v) + arg_v;
    }
    return '<span class=r2' + arg_c + '>'
            + info + arg_v + '</span>';
}

const textArgumentP = function (args, block, op, text, p, i) {
    if(args.infos[op].args[i - 1] == undefined) {
        if(text.charAt(p + 1 + 1) == ' ')
            text = text.substr(0, p) + text.substr(p+1+1+1);
        else text = text.substr(0, p) + text.substr(p+1+1);
        return text;
    }

    let arg_n = args.infos[op].args[i - 1][0];
    let arg_s = args.infos[op].args[i - 1][1];
    let arg_t = args.infos[op].args[i - 1][1];

    if(block[arg_t][arg_n] == undefined) 
        return text;

    let arg_v = block[arg_t][arg_n].value;

    if(args.blocks[block[arg_t][arg_n].block] != undefined) {
        let arg_b = args.blocks[block[arg_t][arg_n].block];
        arg_v = textBlock(args, arg_b);
        arg_s = detectShape(args, arg_b);
        arg_v = formatArgument(args, arg_b, arg_s, arg_t, arg_v, null, arg_n);

        if(p > 0 && text[p-1] != ' ') arg_v = ' ' + arg_v;
        if(p+2 < text.length && text[p+2] != ' ') arg_v = arg_v + ' ';
        text = text.substr(0, p) + arg_v + text.substr(p+2);
        return text;
    }

    if(args.infos[op].option != undefined) {
        let o = args.infos[op].option;
        if(o[arg_v] != undefined) {
            let v = o[arg_v].toLowerCase();
            v = v.replace('operators_', 'operator_');
             if(args.infos[v] != undefined) {
                arg_v = args.infos[v].label;
            }
        }
        //arg_v = '{option}' + arg_v;
    }
    arg_v = label(arg_v);
    arg_v = formatArgument(args, null, arg_s, arg_t, arg_v, args.infos[op].args[i - 1], arg_n);

    if(p > 0 && text[p-1] != ' ') arg_v = ' ' + arg_v;
    if(p+2 < text.length && text[p+2] != ' ') arg_v = arg_v + ' ';
    text = text.substr(0, p) + arg_v + text.substr(p+2);
    return text;
}

const textArgumentV = function(args, block, op, text, p, i) {
    let arg_n = args.infos[op].args[i][0];
    let arg_s = args.infos[op].args[i][1];
    let arg_m = (arg_s == 'menu')? args.infos[op].args[i][2] : null;
    let arg_t = 'inputs';

    if(block[arg_t][arg_n] == undefined)
        return text;

    let arg_v = block[arg_t][arg_n].value;

    if(args.blocks[block[arg_t][arg_n].block] != undefined) {
        let arg_b = args.blocks[block[arg_t][arg_n].block];
        arg_v = textBlock(args, arg_b);
        arg_s = detectShape(args, arg_b);
        if(arg_m != null) {
            const p = op.indexOf('_');
            const id = op.substr(0, p);
            if(args[id].menus != undefined) {
                for(let i=0; i<args[id].menus.length; i++) {
                    let args0 = args[id].menus[i].json.args0;
                    for(let j=0; j<args0.length; j++) {
                        if(args0[j].name == arg_m) {
                            let options = args0[j].options;
                            for(let k=0; k<options.length; k++) {
                                if(options[k][1] == arg_v) {
                                    arg_v = options[k][0];
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
            }
            //arg_v = '<sup>{menu}</sup>' + arg_v;
            arg_t = 'menu';
        }
        arg_v = formatArgument(args, arg_b, arg_s, arg_t, arg_v, null, arg_n);

        if(p > 0 && text[p-1] != ' ') arg_v = ' ' + arg_v;
        if(p+2+arg_n.length < text.length && text[p+2+arg_n.length] != ' ') arg_v = arg_v + ' ';
        text = text.substr(0, p) + arg_v + text.substr(p+2+arg_n.length);
        return text;
    }

    if(args.infos[op].option != undefined) {
        let o = args.infos[op].option;
        if(o[arg_v] != undefined) {
            let v = o[arg_v].toLowerCase();
             if(args.infos[v] != undefined) {
                arg_v = args.infos[v].label;
            }
        }
        //arg_v = '{option}' + arg_v;
    }
    arg_v = label(arg_v);
    arg_v = formatArgument(args, null, arg_s, arg_t, arg_v, null, arg_n);

    if(p > 0 && text[p-1] != ' ') arg_v = ' ' + arg_v;
    if(p+2+arg_n.length < text.length && text[p+2+arg_n.length] != ' ') arg_v = arg_v + ' ';
    text = text.substr(0, p) + arg_v + text.substr(p+2+arg_n.length);
    return text;
}

const textBlock = function (args, block) {
    let op = block.opcode;
    {
        const p = op.indexOf('_');
        const id = op.substr(0, p);
        const id2 = op.substr(p+1);
        if(id.length > 0
        && core.indexOf(id) < 0) {
            if(args.extensions.indexOf(id) < 0) {
                args.extensions.push(id);
                for(let i=0; i<args.runtime._blockInfo.length; i++) {
                    if(args.runtime._blockInfo[i].id == id) {
                        args[id] = args.runtime._blockInfo[i];
                        if(args[id].menuIconURI != undefined) {
                            args.html.push('<style> .icon.' + id + ' {'
                                + ' background-image:url("' + args[id].menuIconURI + '");'
                                + ' } </style>');
                        } else if(args[id].blockIconURI != undefined) {
                            args.html.push('<style> .icon.' + id + ' {'
                                + ' background-image:url("' + args[id].blockIconURI + '");'
                                + ' } </style>');
                        }
                        break;
                    }
                }
            }
            if(args.infos[op] == undefined
            && args[id] != undefined) {
                for(let i=0; i<args[id].blocks.length; i++) {
                    if(args[id].blocks[i].info.opcode == id2) {
                        args.infos[op] = {};
                        args.infos[op].label = args[id].blocks[i].info.text;
                        args.infos[op].shape = args[id].blocks[i].info.blockType;
                        args.infos[op].args = [];
                        for(let arg in args[id].blocks[i].info.arguments) {
                            if(args[id].blocks[i].info.arguments[arg].menu != undefined) {
                                args.infos[op].args.push([arg, 'menu',
                                    args[id].blocks[i].info.arguments[arg].menu]);
                            } else {
                                args.infos[op].args.push([arg,
                                    args[id].blocks[i].info.arguments[arg].type]);
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    let text = null;
    if(op == 'control_if_else') op = 'control_if';
    if(args.infos[op] != undefined) {
        let p = op.indexOf('_');
        let op2 = op.substr(0,p+1) + op.substr(p+1).replace(/_/g, '');
        if(args.infos[op].label != undefined) {
            text = label(args.infos[op].label);
            if(op == 'event_whenflagclicked') {
                text = text.replace('%1', span_icon('flag'));
            } else if(op == 'control_stop') {
                if(text.trim().indexOf('%1') < 0) {
                    text = (text.trim() + ' %1').trim();
                }
            }
        } else
        if(args.infos[op2] != undefined
        && args.infos[op2].label != undefined) {
            text = label(args.infos[op2].label);
        } else
        if(args.infos[op].msg != undefined) {
            text = label(args.infos[op].msg);
        } else
        if(args.infos[op2] != undefined
        && args.infos[op2].msg != undefined) {
            text = label(args.infos[op2].msg);
        } else {
            if(op == 'procedures_call') {
                // proccode: stamp at x: %s y: %s size: %s boost condition: %b
                // argumentids: ["1-{M=6]QfL%VD[*m`YN!","f*q4n@abL8//zpSwsPqD", ... ]
                text = block.mutation.proccode;
                text = label(text);
                let vs = block.mutation.argumentids.substr(1);
                vs = vs.replace(/\",\"/g, '\t');
                vs = vs.substr(0, vs.length - 2).split('\t');
                let i = 0;
                let p = text.indexOf('%');
                while(p >= 0) {
                    vs[i] = vs[i].replace(/\"/g, '');
                    let arg_b = block.inputs[vs[i]];
                    arg_b = args.blocks[arg_b.block];
                    let arg_t = (text.charAt(p+1) == 'b')? 'boolean' : 'string';
                    let arg_v = textBlock(args, arg_b);
                    let arg_s = detectShape(args, arg_b);
                    arg_v = formatArgument(args, arg_b, arg_s, "", arg_v, null, null);
                    text = text.substr(0,p)
                            + arg_v
                            + text.substr(p+2);
                    p = text.indexOf('%', p+arg_v.length);
                    i++;
                }
            } else if(op == 'procedures_prototype') {
                // proccode: stamp at x: %s y: %s size: %s boost condition: %b
                // argumentnames: ["x","y","size","boost"]
                text = block.mutation.proccode;
                text = label(text);
                let vs = block.mutation.argumentnames.substr(1);
                vs = vs.replace(/\",\"/g, '\t');
                vs = vs.substr(0, vs.length - 2).split('\t');
                for(let i=0; i<vs.length; i++) {
                    vs[i] = vs[i].replace(/\"/g, '');
                    let p = text.indexOf("%");
                    if(p < 0) break;
					if(args.textonly) {
	                        text = text.substr(0, p)
	                            + vs[i]
	                            + text.substr(p+2);
					} else {
	                    if(text.charAt(p+1) == 'b')
	                        text = text.substr(0, p)
	                            + '<span class=c1>' + vs[i] + '</span>'
	                            + text.substr(p+2);
	                    else text = text.substr(0, p)
	                            + '<span class=r1>' + vs[i] + '</span>'
	                            + text.substr(p+2);
					}
                }
            }
        }
    }

    if(text == null) {
        for(let b in block.inputs) {
            if(block.inputs[b].value != undefined)
                text = block.inputs[b].value
            break;
        }
        if(text == null) {
            for(let b in block.fields) {
                if(block.fields[b].value != undefined)
                    text = block.fields[b].value
                break;
            }
        }
        if(text == null) {
            text = block.opcode;
        }
    }

	if( ! args.textonly) {
	    if(block.comment != undefined) {
	        args.comments.push([args.line_no, '*' + block.comment]);
	        text += '<sup>*' + args.comments.length + '</sup>';
	    }
	}

    let shape = detectShape(args, block);

    if(op == 'control_stop') {
        let p = text.indexOf('%1');
        let arg_v = block.fields.STOP_OPTION.value;
        let o = args.infos[op].option;
        if(o[arg_v] != undefined) {
            let v = o[arg_v].toLowerCase();
             if(args.infos[v] != undefined) {
                arg_v = args.infos[v].label;
            }
        }
        text = text.substr(0, p) + label(arg_v) + text.substr(p+2);
    }

    if(text != null) {
        if(args.infos[op] != undefined
        && args.infos[op].args != undefined) {
            for(let i=1; i<=9; i++) {
                let p = text.indexOf('%' + i);
                if(p < 0) break;
                text = textArgumentP(args, block, op, text, p, i);
            }
            for(let i=0; i<args.infos[op].args.length; i++) {
                let n = args.infos[op].args[i][0];
                let p = text.indexOf('[' + n + ']');
                if(p < 0) break;
                text = textArgumentV(args, block, op, text, p, i);
            }
        }
    }

    if(text == null) {
        if(args.infos[op] != undefined
        && args.infos[op].args != undefined) {
            let arg_n = args.infos[op].args[0][0];
            let arg_t = args.infos[op].args[0][1];
            if(block[arg_t] != undefined
            && block[arg_t][arg_n] != undefined
            && block[arg_t][arg_n].value != undefined) {
                text = label(block[arg_t][arg_n].value);
            }
        }
    }

    return text;
}

const detectExtIcon = function (args, block) {
    let op = block.opcode;
    let p = op.indexOf('_');
    let id = op.substr(0, p);
    if(args[id] != undefined) {
        if(args[id].menuIconURI != undefined) { return id; }
        if(args[id].blockIconURI != undefined) { return id; }
    }
    return null;
}
const detectShape = function (args, block) {
    let op = block.opcode;
    if(op == 'event_whenflagclicked') { return 'start'; }
    if(op == 'data_variable') { return 'var'; }
    if(op == 'control_stop') { return 'end'; }
    if(op == 'procedures_call') { return 'call'; }
    if(op == 'procedures_definition') { return 'hat'; }
    if(args.infos[op] != undefined) {
        if(args.infos[op].substack != undefined) {
            return (args.infos[op].repeat)? 'do' : 'if';
        }
        if(args.infos[op].shape != undefined) {
            return args.infos[op].shape;
        }
    }
    return op;
}
const detectBackColor = function (args, block) {
    let op = block.opcode;
    let p = op.indexOf('_');
    op = op.substr(0, p);
    if(args.infos[op] != undefined) {
        if(args.infos[op].color1 != undefined) {
            return args.infos[op].color1;
        }
    }
    if(args[op] != undefined) {
        if(args[op].color1 != undefined) {
            return args[op].color1;
        }
    }
    return '';
}
const detectTextColor = function (args, block) {
    let op = block.opcode;
    let p = op.indexOf('_');
    op = op.substr(0, p);
    if(args.infos[op] != undefined) {
        if(args.infos[op].color2 != undefined) {
            return args.infos[op].color2;
        }
    }
    if(args[op] != undefined) {
        if(args[op].color2 != undefined) {
            return args[op].color2;
        }
    }
    return '';
}

const formatBlock = function (args, block, level) {
    let toplevel = (level == 0)? true : false;
    while(block != null) {
        args.line_no++;
        let text = textBlock(args, block);
        let eicon = detectExtIcon(args, block);
        let shape = detectShape(args, block);
        let color = detectBackColor(args, block);
        args.colors[level] = color;
        line = '<span class=col1>';
        line += span_lno(args.line_no);
        line += span_line(args.colors, level);
        if(eicon != null)
             line += span_icon16(eicon);
        else line += span_icon2(shape, '', color);
        line += '</span><span class=col2>';
        if(debug) line += '<sup class=debug>' + block.opcode + '</sup>';
        line += '<span class=oo><span style="display:inline-block; border-color:' + color + ';">';
        line += text;
        line += '</span></span>';
        line += '</span>';
        args.html.push(p(line, (toplevel)? 'top':''));

        if(args.infos[block.opcode] != undefined
        && args.infos[block.opcode].substack != undefined) {
            if(block.inputs.SUBSTACK != undefined
            && block.inputs.SUBSTACK.block != undefined) {
                formatBlock(args, args.blocks[block.inputs.SUBSTACK.block], level+1);
            } else {
                args.line_no++;
                line = span_lno(args.line_no);
                line += span_line(args.colors, level+1);
                args.html.push(p(line));
            }

            if(args.infos[block.opcode].substack > 1) {
                args.line_no++;
                line = '<span class=col1>';
                line += span_lno(args.line_no);
                line += span_line(args.colors, level);
                line += span_icon2('ifelse', '', color);
                line += '</span><span class=col2>';
                line += '<span class=oo><span style="display:inline-block; border-color:' + color + ';">';
                line += label(args.infos['control_else'].label);
                line += '</span></span>';
                line += '</span>';
                args.html.push(p(line));

                if(block.inputs.SUBSTACK2 != undefined
                && block.inputs.SUBSTACK2.block != undefined) {
                    formatBlock(args, args.blocks[block.inputs.SUBSTACK2.block], level+1);
                } else {
                    args.line_no++;
                    line = span_lno(args.line_no);
                    line += span_line(args.colors, level+1);
                    args.html.push(p(line));
                }
            }

            args.line_no++;
            line = span_lno(args.line_no);
            line += span_line(args.colors, level);
            if(args.infos[block.opcode].repeat) {
                line += span_icon2((args.infos[block.opcode].stop)? 'doend2' : 'doend', '', color);
            } else {
                line += span_icon2((args.infos[block.opcode].stop)? 'ifend2' : 'ifend', '', color);
            }
            args.html.push(p(line));
        }
        toplevel = false;
        block = args.blocks[block.next];
    }
}

const formatBlocks = function (args, target, seq) {
    args.textonly = true;
    args.block_no = 0;
	let names = [];
    for (const id in args.blocks) {
        const block = args.blocks[id];
        if(block.shadow) continue;
        if( ! block.topLevel) continue;
        if(block.parent != null) continue;
        let text = textBlock(args, block);
        let shape = detectShape(args, block);
        let eicon = detectExtIcon(args, block);
        let color = detectBackColor(args, block);
        let order = '9';
	    if(block.opcode == 'event_whenflagclicked') order = '1';
		else if(block.opcode == 'procedures_definition') order = '3';
		else if(shape == 'hat') order = '2';
		else order = '9';
		args.seq_id++;
		names.push([order, text.replace(/  /g, " "), args.seq_id, id, shape, eicon, color]);
    }
	if(names.length == 0) return;

	names.sort();
    args.html.push(tag('h3', fm('Blocks')));
    args.html.push('<div id=seq' + seq + '>');
    for (let i=0; i<names.length; i++) {
		args.seq_id++;
        let shape = span_icon2(names[i][4], '', names[i][6]);
		if(names[i][5] != null) shape = span_icon16(names[i][5]);
		args.html.push('<span class=block><a class=link onclick="gbox_seq(' + args.seq_id + ')">'
				+ '<span class=col1>' + shape + '</span>'
				+ '<span class=col2>' + names[i][1] + '</span></a></span>');
		names[i][1] = args.seq_id;
    }
    args.html.push('</div>');

    args.textonly = false;
    args.block_no = 0;
    for (let i=0; i<names.length; i++) {
		let id = names[i][3];
        const block = args.blocks[id];
        if(block.shadow) continue;
        if( ! block.topLevel) continue;
        if(block.parent != null) continue;
        args.block_no++;
        args.line_no = 0;
        args.comments = [];
	    args.html.push('<a id="seq' + names[i][1] + '"></a>');
        args.html.push(tag('h3', fm('Block') + ' ' + args.block_no));
        formatBlock(args, block, 0);
        formatComments(args, target);
    }
};

const resizeCostume = function(args, data, width, id) {
    return new Promise((resolve, reject) => {
        let img = new Image;
        img.src = '';
        img.onload = function () {
            let w = img.naturalWidth;
            let h = img.naturalHeight;
            let canvas = document.createElement('canvas');
			if(w > h) {
	            canvas.width = width;
    	        canvas.height = Math.round(h * width / w);
			} else {
	            canvas.width = Math.round(w * width / h);
    	        canvas.height = width;
			}
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
            args.costumes[id] = [canvas.toDataURL(), canvas.width, canvas.height];
            canvas.remove();
            resolve();
        };
        img.src = data;
    });
};    

const assetDataURL = function (asset) {
    let type = asset.assetType.contentType;
    let data = ''; 
    for(let i = 0; i < asset.data.length; i+=1024) {
        data += String.fromCharCode.apply(null, asset.data.slice(i, i+1024));
    }
    if(type.indexOf('svg') < 0) {
        data = btoa(data);
        data = 'data:' + type + ';base64,' + data;
    } else {
        data = 'data:' + type + ',' + encodeURIComponent(data);
    }
    return data;
}

const resizeCostumes = function (args, base, costumes) {
    if(costumes.length <= 0) return;
    for (const id in costumes) {
        const c = costumes[id];
        let data = assetDataURL(c.asset);
        args.costumes[ base + id] = [data, c.size[0], c.size[1]];
        args.promises.push(resizeCostume(args, data, 64, base + id));
    }
};

const formatCostumes = function (args, base, costumes) {
    if(costumes.length <= 0) return;
    args.html.push(tag('h3', fm('Costumes')));
    args.html.push('<div class=p>');
    let n = 0;
    for (const id in costumes) {
        n++
        const c = costumes[id];
        let t = '';
        if(c.size[0] != 0 && c.size[1] != 0) {
        	//t += '<img class=img src="' + args.costumes[base + id][0] + '">';
        	t += '<span class="img resz ' + args.costumes[base + id] + '"></span>';
        }
		let w = Math.round(c.size[0]);
		let h = Math.round(c.size[1]);
		args.html.push('<span class=block>' + n + ': ' + '"' + label(c.name) + '"<br>'
        		+ '<small>( ' + w + ' x ' + h + ' )</small><br>'
	    		+ t + '</span>');
    }
    args.html.push('</div>');
};

const formatBackdrops = function (args, base, costumes) {
    if(costumes.length <= 0) return;
    args.html.push(tag('h3', fm('Backdrops')));
    args.html.push('<div class=p>');
    let n = 0;
    for (const id in costumes) {
        n++
        const c = costumes[id];
		let w = Math.round(c.size[0]);
		let h = Math.round(c.size[1]);
        args.html.push('<span class=block>' + n + ': ' + '"' + label(c.name) + '"<br>'
        		+ '<small>( ' + w + ' x ' + h + ' )</small><br>'
                //+ '<img class=img src="' + args.costumes[base + id][0] + '">'
        		+ '<span class="img resz ' + args.costumes[base + id] + '"></span>'
				+ '</span>');
    }
    args.html.push('</div>');
};

const formatSounds = function (args, sounds) {
    if(sounds.length <= 0) return;
    args.html.push(tag('h3', fm('Sounds')));
    for (const id in sounds) {
        const s = sounds[id];
        args.html.push('<div class="p sound">');
        args.html.push(span_play(span_icon('sound') + '"' + label(s.name) + '"'
            + '&nbsp;&nbsp;' + fm('Format') + ': ' + s.dataFormat
            + '&nbsp;&nbsp;' + fm('Length') + ': ' + (Math.round(s.sampleCount / s.rate * 100) / 100) + ' ' + fm('sec')));
        let data = assetDataURL(s.asset);
        args.html.push('<audio><source src="' + data + '"'
                + ' type="' + s.asset.assetType.contentType + '"/>'
                + '</audio>');
        args.html.push('</div>');
    }
};

const formatVariables = function (args, variables, local) {
    if(variables == undefined) return;
    let vars = [];
    let msgs = [];
    let list = [];
    let cloud = [];
    for (let id in variables) {
        const v = variables[id];
        if (v.type === Variable.BROADCAST_MESSAGE_TYPE) {
            msgs.push(fm('Broadcast') + ': "' + label(v.value) + '"');
            continue;
        }
        if (v.type === Variable.LIST_TYPE) {
            list.push(fm('List') + ': ' + label(v.name) + ' = [' + label(v.value) + ']');
            continue;
        }
        if (v.isCloud) {
            vars.push(fm('Cloud') +  ': ' + label(v.name) + ' = "' + label(v.value) + '"');
            continue;
        }
        vars.push(label(v.name) + ' = "' + label(v.value) + '"');
    }
    if(vars.length <= 0
    && msgs.length <= 0
    && list.length <= 0
    && cloud.length <= 0) return;
    vars.sort();
    msgs.sort();
    list.sort();
    cloud.sort();
    if( ! local) {
        args.html.push(tag('h2', fm('Variables')));
    } else {
        args.html.push(tag('h3', fm('Local variables')));
    }
    args.html.push('<div class=ul>');
    for(let i=0; i<msgs.length; i++) {
        args.html.push(ul_li(msgs[i]));
    }
    for(let i=0; i<list.length; i++) {
        args.html.push(ul_li(list[i]));
    }
    for(let i=0; i<cloud.length; i++) {
        args.html.push(ul_li(cloud[i]));
    }
    for(let i=0; i<vars.length; i++) {
        args.html.push(ul_li(vars[i]));
    }
    args.html.push('</div>');
};

const formatTargetComments = function (args, target) {
    if(target.comments.length <= 0) return;
    let cs = [];
    for (let id in target.comments) {
        let c = target.comments[id];
        if(c.blockId == null) cs.push(c);
    }
    if(cs.length <= 0) return;
    args.html.push(tag('h3', fm('Comments')));
    args.html.push('<div class=ul>');
    for(let i=0; i<cs.length; i++) {
        let c = cs[i];
        let line = '<span class=col2>';
        line += c.text.replace(/\n/g, '<br>');
        line += '</span>';
        args.html.push(p(line, 'top'));
    }
    args.html.push('</div>');
};

const formatComments = function (args, target) {
    if(args.comments.length <= 0) return;
    for (let i=0; i<args.comments.length; i++) {
        let text = args.comments[i][1];
        let mark = text.charAt(0);
        if(mark == '*')
            text = target.comments[text.substr(1)].text;
        let line = '<span class=col1>';
        line += span_lno(args.comments[i][0]);
        line += span_cno(mark + (i+1));
        line += '</span><span class=col2>';
        line += label(text);
        line += '</span>';
        args.html.push(p(line, (i==0)? 'top':''));
    }
};

const formatExtensions = function (args) {
    if(args.extensions.length <= 0) return;
    args.html.push(tag('h2', fm('Extensions')));
    args.html.push('<div class=ul>');
    for (let i=0; i<args.extensions.length; i++) {
        args.html.push('<span class=block>'
                + label(args[args.extensions[i]].name)
                + '<br>' + span_icon64(args.extensions[i])
				+ '</span>');
    }
    args.html.push('</div>');
};

const formatProject = function (args, title) {
    args.block = 0;
    args.line = 0;
    args.colors = [];
    args.html = [];
    args.extensions = [];
    args.title = title;
    args.seq_id = 0;

    args.html.push('<style>');
	let cs = [];
	for(let id in args.costumes) {
		cs.push(id);
	}
	for(let i=0; i<cs.length; i++) {
		if(cs[i] == null) continue;
		c = args.costumes[cs[i]];
		if(c[1] == 0 || c[2] == 0) {
			args.costumes[cs[i]] = null;
			continue;
		}
	    args.html.push('.costume_' + i
					+ ' { width:' + c[1] + 'px; height:' + c[2] + 'px;'
					+ ' background-image:url(' + c[0] + '); }');
		args.costumes[cs[i]] = 'costume_' + i;
		for(let j=i+1; j<cs.length; j++) {
			if(cs[j] == null) continue;
			d = args.costumes[cs[j]];
			if(d[1] == c[1]
			&& d[2] == c[2]
			&& d[0] == c[0]) {
				args.costumes[cs[j]] = 'costume_' + i;
				cs[j] = null;
			}
		}
	}
    args.html.push('</style>');

    args.html.push('<a id="seq0"></a>');
    args.html.push(tag('h1', title));
    let stage = null;
    let names_seq = [];
    let gline = [];
    args.html.push('<span class=cell>');
    {
        args.runtime.renderer.draw();
        let img = args.runtime.renderer.canvas;
//       	img = img.parentElement;
//		while(true) {
//			if(img.className.indexOf("stage-wrapper_stage-canvas-wrapper") >= 0) break;
//        	img = img.parentElement;
//		}
        let w = img.clientWidth;
        let h = img.clientHeight;
        let canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = Math.round(h * canvas.width / w);
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
        let data = canvas.toDataURL();
        canvas.remove();
        args.html.push('<img class=imgx src="' + data + '" style="margin-right:1em;">');
    }
    args.html.push('</span><span class=cell>');
    args.html.push(tag('h3', fm('Sprites')));
    {
	    let names = [];
        for(let i=0; i<args.runtime.targets.length; i++) {
            let target = args.runtime.targets[i];
            if(target.sprite.name == 'Stage') {
                stage = target;
                continue;
            }
			args.seq_id++;
			names_seq[target.id] = args.seq_id;
            names.push([target.sprite.name, args.seq_id, target.id + target.currentCostume]);
			args.seq_id++; // for blocks
        }
        names.sort();
        for(let i=0; i<names.length; i++) {
            let t = '<div class=block>';
            t += '<a class=link onclick="gbox_seq(' + names[i][1] + ')">' + names[i][0];
			t += '<br>';
   	    	//if(args.costumes[names[i][2]][0].length > 10)
	   	    //	t += '<img class=img src="' + args.costumes[names[i][2]][0] + '">';
   	    	if(args.costumes[names[i][2]] != null)
	        	t += '<spanv class="img resz ' + args.costumes[names[i][2]] + '"></span>';
            args.html.push(t + '</a></div>');
			gline.push('<div onclick="gbox_gseq(this,' + names[i][1] + ')">'
					+ '<div><span class="gmode" onclick="gbox_gmode(this,' + names[i][1] + ')">&#x2bc8</span>' +  names[i][0] + '</div>'
					+ '<ul class=ul></ul></div>');
        }
    }

    args.html.push('</span>');

    if(stage != null) {
        let target = stage;

        args.html.push(tag('h2', '<a onclick="gbox_seq(0)">' + fm('Stage') + '</a>'));
        args.html.push('<div class=ul>');

        formatTargetComments(args, target);

        formatBackdrops(args, target.id, target.sprite.costumes);
        formatSounds(args, target.sprite.sounds);

		args.seq_id++;
        args.blocks = target.blocks._blocks;
        formatBlocks(args, target, args.seq_id);

        args.html.push('</div>');
    }

    formatVariables(args, stage.variables, null);

    for(let i=0; i<args.runtime.targets.length; i++) {
        let target = args.runtime.targets[i];
        if(target.sprite.name == 'Stage') continue;

        args.html.push('<a id=seq' + names_seq[target.id] + '></a>');
        args.html.push(tag('h2',
                '<a onclick="gbox_seq(0)">'
                +  fm('Sprite') + ': ' + label(target.sprite.name)
                + '</a>'));
        args.html.push('<div class=ul>');

        formatTargetComments(args, target);

        formatCostumes(args, target.id, target.sprite.costumes);
        formatSounds(args, target.sprite.sounds);

        formatVariables(args, target.variables, true);

        args.blocks = target.blocks._blocks;
        formatBlocks(args, target, names_seq[target.id]+1);

        args.html.push('</div>');
    }

    formatExtensions(args);

    args.html.push(p('&nbsp;'));
    args.html.push('<hr>');
    const day = new Date();
    args.html.push(p(fm('Output date') + ': ' + day.toLocaleDateString() + ' ' + day.toLocaleTimeString()));

    return header(title, args.locale)
				+ guide(fm('Sprites'), gline, fm('Color mode'))
				+ args.html.join('\n') + '\n' + footer();
};

const format = function (title, infos, runtime) {
    fm_setup();
    return new Promise((resolve, reject) => {
        const args = {};
        args.infos= infos;
        args.runtime = runtime;
        args.locale = formatMessage.setup().locale;
        args.promises = [];
        args.costumes = {};
        for(let i=0; i<args.runtime.targets.length; i++) {
            let target = args.runtime.targets[i];
            resizeCostumes(args, target.id, target.sprite.costumes);
        }
        if(args.promises.length > 0) {
            Promise.all(args.promises).then(function() {
                resolve(formatProject(args, title));
            });
        } else {
            resolve(formatProject(args, title));
        }
    });
};

const fm_setup = function () {
    const msgs = {
    'ja': {
        'sb3html.backdrops':'背景',
        'sb3html.costumes':'コスチューム',
        'sb3html.blocks': 'ブロック一覧',
        'sb3html.block': 'ブロック',
        'sb3html.cloud': 'クラウド',
        'sb3html.list':'リスト',
        'sb3html.sounds':'サウンド',
        'sb3html.broadcast':'メッセージ',
        'sb3html.local_variables': 'ローカル変数',
        'sb3html.comments': 'コメント',
        'sb3html.variables': '変数',
        'sb3html.extensions': '拡張機能',
        'sb3html.sprite': 'スプライト',
        'sb3html.sprites': 'スプライト一覧',
        'sb3html.stage': 'ステージ',
        'sb3html.output_date': '出力日時',
		'sb3html.color_mode': 'カラーモード',
        'sb3html.format': '形式',
        'sb3html.length': '長さ',
        'sb3html.sec': '秒',
    } };
    const localeSetup = formatMessage.setup();
    for (const locale in msgs) {
        if (!localeSetup.translations[locale]) {
            localeSetup.translations[locale] = {};
        }
        Object.assign(localeSetup.translations[locale], msgs[locale]);
    }
};

const fm = function (val) { return formatMessage({id:'sb3html.' + val.toLowerCase().replace(/ /g, '_'), default:val}); };

const label = function (val) { return ('' + val).replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
const p = function (val, cls) {
    if(cls == undefined) cls = '';
    return '<div class="p ' + cls + '">' + val + '</div>';
};
const tag = function (name, val) { return '<' + name + '>' + val + '</' + name + '>'; };
const span_icon = function (val) {
    return '<span class="icon ' + val + '"></span>';
};
const span_icon16 = function (val) {
    return '<span class="icon sz16 ' + val + '" style="background-size:16px 16px;"></span>';
};
const span_icon64 = function (val) {
    return '<span class="icon sz64 ' + val + '" style="background-size:64px 64px;"></span>';
};
const span_icon2 = function (val, as, rgb) {
    return '<span class="icon g ' + as + '">'
            + '<span class="icon ' + val + '" style="background-color:' + rgb +';"></span>'
            + '</span>';
};
const span_play = function (val) { return '<span class=play onclick="span_play(this)">' + val + '</span>'; };
const span_lno = function(val) { return '<span class=lno>' + val + ':</span>'; };
const span_cno = function(val) { return '<span class=cno>' + val + ':</span>'; };
const span_line = function(colors, level) { 
    let line = '';
    for(let i=0; i<level; i++) {
        line += span_icon2('line', 'sz8', colors[i]);
    }
    return line;
}
const span_color = function(rgb) { return '<span class=color style="background:' + rgb + '"></span>'; }

const ul_li = function (val) { return '<ul class=ul><li>' + val + '</li></ul>'; };

const header = function (title, lang) {
    return [
    '<!doctype html><html lang=' + lang + '><head><meta charset="UTF-8"><style>',
    '.debug { display:none; }',
    'body { font-size:14px; font-family:ui-monospace; }',
    'body { padding:0.5em 0.5em; }',
    'h1,h2,h3 { margin-top:0.3em; margin-bottom:0.1em;}',
    'h1, h2 { border-bottom:1px solid #ccc; background:#cccccc88; padding:0.2em 0.2em; padding-bottom:0; }',
    'h1 { margin-bottom:0.5em; }',
    'h2, h3 { margin-top:0.5em; position:relative; }',
    'h2 > a { text-decoration:none; color:inherit; }',
	'.back { position:absolute; top:0, right:0.5em; }',
    '.ul { margin-left:1em; }',
    'ul.ul { margin:0; padding-left:1.2em; }',
    'ul.ul > li { word-break:break-all; }',
    '.lno { min-width:2em; display:inline-block; text-align:right; }',
    '.cno { min-width:2em; display:inline-block; text-align:right; margin-left:0.5em; margin-right:0.5em; }',
    '.cell { display:table-cell; padding-left:1em; vertical-align:top; }',
    '.block { display:inline-block; padding-left:1em; vertical-align:top; max-width:120px; word-break:break-all; }',
    '.link { width:120px; margin-right:2em; display:inline-block; word-break: break-all; vertical-align:top; line-height:16px; margin-bottom:6px; cursor:pointer; }',
    '.block .link { display:inline; }',
    '.col1 { display:table-cell; white-space:nowrap; vertical-align:top; }',
    '.col2 { display:table-cell; }',
    '.play { cursor:pointer; }',
    '.img { height:auto; padding:1px 1px; border:1px solid #ccc; background-color:#cccccc88;}',
    '.imgs { width:16px; height:auto; padding:1px 1px; border:1px solid #ccc; }',
    '.imgx { padding:1px 1px; border:1px solid #ccc; }',
	'.resz { display:inline-block; background-repeat:no-repeat; background-position:1px 1px; }',
    '.p.sound { margin-top:0.1em; }',
    '.color { width:12px; height:12px; border:1px solid #ccc; display:inline-block; vertical-align:middle; border-radius: 6px 6px; margin-right: 2px; }',
    '.p { margin-left:1em; margin:0; padding:0; }',
    '.p.top { margin-top:0.5em; }',
    '.l0 { width:0; display:inline-block; }',
    '.icon { margin-left:2px; display:inline-block; width:16px; height:14px; margin-right:0.4em; }',
    '.icon.lsz0 { margin-left:0; }',
    '.icon.rsz1 { margin-right:0.1em; }',
    '.icon.g { position:relative; }',
    '.icon.g icon { position:absolute;top:0;left:0;margin-left:0; }',
    '.icon.g.sz8 { width:8px; overflow:hidden; margin-right:2px; }',
    '.icon.sz16 { width:16px; height:16px; }',
    '.icon.sz64 { width:64px; height:64px; }',
    '.icon.start { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFS0XM2v81QAAAAlwSFlzAAAOdAAADnQBaySz1gAAAA9QTFRF/8kO////AAAAHZc9IrFMbxAaygAAAAF0Uk5TAEDm2GYAAABfSURBVHjaTY5JAsAwCAJZ/P+bi5q05RSRIYKCABGRygB7oBincBSDHcMkBXtWajJKPOLNDOtyyjInex7L/6k0N9X4LqeFi9nXmxNdrbdk+r7Que6Vuvlew/2Fc6au8QB/jAEHIb1s8gAAAABJRU5ErkJggg==); }',
    '.icon.hat { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFSsjRIWv5gAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF/8kO////AAAAD1+oewAAAAF0Uk5TAEDm2GYAAABRSURBVHjahY5RDsAwCELl3f/Qg1qbLlkyPpr6FLREUYXKIo9SCC2yZaDupslg4rQ8bmlmLi8fn8vl5Lhi34HoxJwl8AId8gucM9eot2idyYAHTHEAoOb+iWoAAAAASUVORK5CYII=); }',
    '.icon.statement, .icon.command { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFS0sgmAV8QAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF/8kO////AAAAD1+oewAAAAF0Uk5TAEDm2GYAAABQSURBVHjajY5BEsAgDAKB/z9aQG1z6KEZk0mQrEKCADqBFkI56nCCoDWX19ZGyRDkK3W0cTo+mmcrNLLk7B16LduhKcz4I1xeyXmF+4+6wgJRswCnZRVkPQAAAABJRU5ErkJggg==); }',
    '.icon.if { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFSs5uedWnAAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF/8kOAAAA/////0Tk2AAAAAF0Uk5TAEDm2GYAAABNSURBVHjadU5JDgAhDCr8/9GDBDrxoFFD2XSA0SZGKxc5IDyEE0ULcUQ0gI+kAxTkhgJajZ0cQnrdfHJpjxGop8m/tY7+40WklvvKRXxGqwCdnR7Z9gAAAABJRU5ErkJggg==); }',
    '.icon.ifelse { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFSwSWho5GwAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF/8kOAAAA/////0Tk2AAAAAF0Uk5TAEDm2GYAAABESURBVHjajY3bDgAgCEKB///ovKS2eolNO+IkUCAAWQVYkw1SOCUfGU9CyoAux1wdgE58gNdV/qvWNkZzXiGfxhs6xgJOrQCp6VJLLQAAAABJRU5ErkJggg==); }',
    '.icon.ifend { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFSwsm3sksAAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF/8kO////AAAAD1+oewAAAAF0Uk5TAEDm2GYAAABGSURBVHjalY1RCgAgDELV+x86c2P1FSQs7DUNIgSAnhg7I5AhLfper7MWoz37dIZXRC8zKSr/dLOOzvZk/oGLq5elgKjBAkELAJE4E08sAAAAAElFTkSuQmCC); }',
    '.icon.ifend2 { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFS0Et9W9CwAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAxQTFRF/8kOAAAAgICA////hWxQ1gAAAAF0Uk5TAEDm2GYAAAA/SURBVHjalY1RCgAgCEO3dv87Z2YqfQQ9ELbpEBQIQDYuMAzz8iTwjMeVCJaUWoUvka0R7CWLus7Of6CL/sCZTJoArRASV7MAAAAASUVORK5CYII=); }',
    '.icon.line { width:8px; background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QUdDhUcyeS38gAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAZQTFRF////AAAAVcLTfgAAAAF0Uk5TAEDm2GYAAAAbSURBVHjaY2BkYAAiCGCEEyQDRkpECNtLCxUACScAEaOMnO0AAAAASUVORK5CYII=); }',
    '.icon.end { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFSsPdl3DBQAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAxQTFRF/8kOAAAAgICA////hWxQ1gAAAAF0Uk5TAEDm2GYAAABGSURBVHjajY1RDgAQDENbvf+d1YyM+PAS0lU7IEFAPkBczYBiDMn0oBILkVj4aQgXdSQeYrdagtnL7RFZu4tR+TF0sf9ddFS3AL3RJxEmAAAAAElFTkSuQmCC); }',
//  '.icon.null { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA2SURBVDhPpcixEQAgAAMh9186LkDhnwUNZ9sXZsEsmAWzYBbMglkwC2bBLJgFs2AWzIL5bucCxa39H+iOy+4AAAAASUVORK5CYII=); }',
    '.icon.var,.icon.number,.icon.string,.icon.reporter { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFS4CdZtL/QAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF/8kO////AAAAD1+oewAAAAF0Uk5TAEDm2GYAAABKSURBVHjaVU7REgAhEMH/f/Rt4SoPJjIsSAgYHpgkjrYjkz0tJdp0FPkP7Ohk2Kjq9LFHNKDXFKTm30jdpZeDR/vER6e9+a7c+ABRfACpcRqmKQAAAABJRU5ErkJggg==); }',
    '.icon.cond,.icon.boolean { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFSkqD291wAAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF/8kO////AAAAD1+oewAAAAF0Uk5TAEDm2GYAAABSSURBVHjaTY5REgBABELT/Q+9Ucz2YXjSQBUKUJVUqJZCknpMEeOw7s1bNEHsc3Ke2fTqzG6YFW1WbuWco43RmEM7dgzCPzdBfRYyoUZOvSdXD15HAMVLtwVxAAAAAElFTkSuQmCC); }',
    '.icon.sound { margin-left:1em; vertical-align:top; background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QUdFDIQCyZvGgAAAAlwSFlzAAAOdAAADnQBaySz1gAAACpQTFRF////x8fHjY2Nnp6eQ0NDrq6ufX19S0tL////dHR04ODgbGxsXFxcU1NTIehD1QAAAAF0Uk5TAEDm2GYAAABoSURBVHjabY5RDsAgCEOrdoA673/diZjNjzVRtHkNBabEL9o8UvBpsApI3kAKh1cMUhT0JAXZjgwK18iTQeNiCR3xaJ2RBzSwI5nOD0x8iyNqsdIljd280GtAdRZd3DZqKysYbXblHz0QnQI19bdA5QAAAABJRU5ErkJggg==); }',
    '.icon.flag { width:14px; margin-left:0em; margin-right:0em; vertical-align:baseline; background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAFfke11AAAAFXRFWHRDcmVhdGlvbiBUaW1lAAflBR0UJQjIyJCqAAAAB3RJTUUH5QUdFTUPyK2eHwAAAAlwSFlzAAAK8AAACvABQqw0mAAAAJlQTFRF////XaZW7fXsT55H5/Lm4e7gnMmYf7p6hLx/r9Or8/jzrNGp8Pbv+Pv45PDjl8aSS6hJSrdRS71VS7xUSbNOX6paSK1KSahIT6lMSKlISrZQTL9WTqVLS7pSSa9MSKlHSKpITqVKSbJNS75VS71USa5LbrJpwt2/5/Hm4O7erdKpZatfmceVcrRtZq9ifbh4vdq6/f79/v7+QQRXsAAAAAF0Uk5TAEDm2GYAAAB0SURBVHjaY2AAAmkwIQPEcooMcCArrQDE0gwsII6OngEDgxFIEAiAKrl5+QWFReFqGXX1DUE0s7S0sLwImAYCJJqHT0AIJM6AHTArKUurqKqpa2hqaYO4YGukoXZhcMXEJSSlEFywA1nZ2Dk4uUBOYUIyFwDO4Qrml3Nd8gAAAABJRU5ErkJggg==); }',
    '.icon.sz12 { width:12px; height:12px; background-size:12px 12px; }',
    '.icon.do { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFSoGFppK4AAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF/8kOAAAA/////0Tk2AAAAAF0Uk5TAEDm2GYAAABSSURBVHjaVU6BDQAgCAL+PzpEXeXKCAUFCR8RjkkSKOYD9KvinDkUt8YKZ5cKWKg1Gsduzk1D08HRxRkBOzJEO//EtSXuxg/xS2rxGO+UmdNxAEkbAJ8bsN0YAAAAAElFTkSuQmCC); }',
    '.icon.doend { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFSoc6/izmgAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF/8kO////AAAAD1+oewAAAAF0Uk5TAEDm2GYAAABNSURBVHjaVU6BDQAgCAL+PzqFzMVWAwINIiTUXSgC0IJkJOK1NLUzRH0SYwPbkVPCyBmvbVGp5TGmcQUGmsQO1Fv/f2krNTgNBjaMaxxb+wC/4KlOAQAAAABJRU5ErkJggg==); }',
    '.icon.doend2 { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYEFyUGkoaCQQAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAxQTFRF/8kOAAAAgICA////hWxQ1gAAAAF0Uk5TAEDm2GYAAABLSURBVHjaXY5BEsAwCALZ+P8/1zFSpt1DAgaZiBKoz6aFdJq+qq7VO2PkTCwWTb5RdpgUsnU92TrLfUwda2RwIoXug++XslI/Ur88V2kAwQEnlc4AAAAASUVORK5CYII=); }',
    '.icon.call { background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAFm9lwuAAAAB3RJTUUH5QYNASAGilLmTAAAAAlwSFlzAAAOdAAADnQBaySz1gAAAAlQTFRF//IA////AAAAh8ecDQAAAAF0Uk5TAEDm2GYAAABLSURBVHjabY0BDsAwCAI9/v/oadFm60pSQ66ggUIRECnVAOExRMOoMIaONlkm3zIJ6IDG7I5emU+rd8m/o2pUdJ/0El3AWfkt5dADXA4Ay21tm8YAAAAASUVORK5CYII=); }',
	'.check { width:14px; height:12px; background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAMCAYAAABSgIzaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAADqSURBVChTY/wPBAxEgh0XTzDcePWEIcbYkYFojdsvnGDIedQKZpfwpjAwgVkEALIm/x9eDPbKugiNb969hbJQwfYLx1E0pVi4M2jJKUE0Pnn1gmH60W0Ma04dACuAAYimNjAbWRMIgDWuOHeIYcH/VQzlL3oZ1p85BJbApwkEwIFz5+kjhlnHdzCsZdsMFszjTGCY9H0BmB3ww5sh2cINRRMIwEP1NlDzbCTNIIBLEwjAA0dVWo4h2dwNrBgE8GkCA5CNyOD6o3v/6zbM/3/t4T2oCHaANQG8//CBQVBAAMrDDkhKcgjAwAAAduej8Cz/xA8AAAAASUVORK5CYII=); }',

    '.b1, .b2, .c1, .c2, .r1, .r2 { display:inline-block; border-color:gray; word-break:break-all; margin-left:10px; margin-right:10px; position:relative; padding:0 2px; }',
    '.b1:before, .b1:after, .b2:before, .b2:after, .c1:before, .c1:after, .c2:before, .c2:after, .r1:before, .r1:after, .r2:before, .r2:after { content:""; display:inline-block; border-style:solid; border-color:inherit; }',
    '.b2:before, .b2:after, .c2:before, .c2:after, .r2:before, .r2:after { border-style:double; }',
    '.b1:before, .b1:after, .b2:before, .b2:after { width:3px; height:7px;}',
    '.b1:before, .b2:before { top:3px; left:-6px; margin-left:0px; margin-right:0px; border-width:4px 0; border-left-width:4px; position:absolute; }',
    '.b1:after, .b2:after { bottom:3px; right:-6px; margin-left:0px; margin-right:0px; border-width:4px 0; border-right-width:4px; position:absolute; }',
    '.r1:before, .r1:after, .r2:before, .r2:after { width:14px; height:14px; transform:rotate(0deg); }',
    '.r1:before, .r2:before { top:0px; left:-6px; margin-left:0px; margin-right:0px; border-width:4px; border-radius:22px; border-color:transparent; border-left-color:inherit; position:absolute; }',
    '.r1:after, .r2:after { bottom:-1px; right:-6px; margin-left:0px; margin-right:0px; border-width:4px; border-radius:22px; border-color:transparent; border-right-color:inherit; position:absolute; }',
    '.c1:before, .c1:after, .c2:before, .c2:after { width:1px; height:1px; }',
    '.c1:before, .c2:before { top:6px; left:-6px; margin-left:0px; margin-right:0px; border-width:4px; border-top-color:transparent; border-right-color:transparent; transform:rotate(58deg) skewX(28deg); position:absolute; }',
    '.c1:after, .c2:after { bottom:6px; right:-6px; margin-left:0px; margin-right:0px; border-width:4px; border-top-color:transparent; border-left-color:transparent; transform:rotate(-58deg) skewX(-28deg); position:absolute; }',
    '.b1.icon, .b2.icon, .c1.icon, .c2.icon, .r1.icon, .r2.icon { margin-right:0; }',
    '.oo, .o { display:inline-block; position:relative; margin-bottom:0px; }',
    '.o[o="1"]:before { content:""; display:inline-block; position:absolute; top:3px; left:10px; width:calc(100% - 20px); height:calc(100% - 6px); background:white; }',
    '.oo[o="1"] { padding:2px 0; }',
    '.o[o="1"] { padding:3px 0; }',
    '.oo[o="1"] > span, .o[o="1"] > span { padding:1px 2px; }',
    '.o[o="1"] > span.r1:before, .o[o="1"] > span.r1:after { top:calc(50% - 11px); bottom:unset; }',
    '.o[o="1"] > span.c1:before, .o[o="1"] > span.c1:after { top:calc(50% - 5px); bottom:unset; }',

    '#cbox { position:fixed; display:inline-block; right:6px; top:6px; z-index:2; width:160px; height:22px; cursor:pointer; text-align:right; padding-right:10px; color:#ddd; font-size:12px; }',
    '#gbox { position:fixed; right:5px; top:5px; border:1px solid #ccc; z-index:1; height:calc(100% - 16px); width:160px; background-color:white; font-size:12px; }',
    '#gbox > div:first-child { padding:0 5px; background-color:#eee; border-bottom:1px solid #ccc; }',
    '#gline { display:inline-block; right:0px; margin-top:0px; height:calc(100% - 42px); overflow:hidden auto; width:160px; }',
    '#gline > div { padding:0 4px; border-bottom:1px solid #eee; cursor:pointer; position:relative; }',
    '#cmode { display:inline-block;height:12px;position:relative;width:14px;overflow:hidden; }',
    '#gcheck { position:absolute;display:inline-block;top:2px; left:2px }',
    '.gmode { padding: 0 2px; }',
    '#gline ul { padding-left:8px; }',
    '#gline .text { display:inline-block; width:calc(100% - 30px); font-size:12px; word-break:break-all; }',
    '#gline .line * { vertical-align:top; }',

    '</style>',
    '<script>',
    'function span_play(e) { e.parentElement.getElementsByTagName("audio")[0].play(); }',
    'function gbox_show() {',
	' let g = document.getElementById("gbox");',
	' let b = document.body;',
	' if(g.style.display == "none") {',
	'   g.style.display = "inline-block";',
	'   b.style.paddingRight = "170px";',
	' } else {',
	'   g.style.display = "none";',
	'   b.style.paddingRight = "0.5em";',
	' } }',
    'function gbox_seq(i) {',
    ' document.getElementById("seq" + i).scrollIntoView();',
    ' event.preventDefault();',
    ' event.stopPropagation();',
    '}',
    'function gbox_gseq(e, i) {',
    ' gbox_seq(i);',
	' if(gbox_gmode_ul != null) {',
	'  gbox_gmode_ul[0].innerHTML = "&#x2bc8";',
	'  gbox_gmode_ul[1].innerHTML = "";',
	'  gbox_gmode_ul = null;',
	' }',
    ' gbox_gmode(e.querySelectorAll(".gmode")[0], i);',
    '}',
    'var gbox_gmode_ul = null;',
    'function gbox_gmode(e, n) {',
    ' let ul = e.parentElement.parentElement.querySelectorAll("ul");',
    ' if(ul.length <= 0) return;',
    ' if(ul[0].innerHTML == "") {',
	'  if(gbox_gmode_ul != null) {',
	'   gbox_gmode_ul[0].innerHTML = "&#x2bc8";',
	'   gbox_gmode_ul[1].innerHTML = "";',
	'  }',
	'  e.innerHTML = "&#x2bc6";',
    '  let es = document.querySelectorAll("#seq" + (n+1) + " > span.block"); if(es.length <= 0) return;',
    '  let t = "";',
    '  for(let i=0; i<es.length; i++) {',
    '   let h = es[i].innerHTML;',
    '   let p = h.indexOf("onclick=");',
    '   let q = h.indexOf(">",p);',
    '   t += "<div class=line " + h.substring(p, q) + ">";',
    '   p = h.indexOf("icon");',
    '   p = h.indexOf("icon", p+1);',
    '   q = h.indexOf(\'"\',p);',
    '   t += "<span class=\'" + h.substring(p, q) + "\'";',
    '   p = h.indexOf("background");',
    '   q = h.indexOf(\'"\',p);',
    '   t += " style=\'" + h.substring(p, q) + "\'></span>";',
	'   t += "<span class=text>";',
    '   q = h.indexOf("icon flag");',
    '   if(q >= 0) t += "<span class=\'icon flag sz12\'></span>";',
	'   t += es[i].textContent + "</span></div>";',
    '  }',
    '  ul[0].innerHTML = t;',
	'  gbox_gmode_ul = [e, ul[0]];',
    ' } else {',
	'  e.innerHTML = "&#x2bc8";',
	'  ul[0].innerHTML = "";',
	'  gbox_gmode_ul = null;',
	' }',
    ' event.preventDefault();',
    ' event.stopPropagation();',
    '}',
    'function gbox_cmode() {',
    ' let es = document.querySelectorAll(".oo"); if(es.length <= 0) return;',
    ' let v = (es[0].getAttribute("o") != 1)? 1 : 0;',
    ' document.getElementById("gcheck").className = (v != 1)? "" : "check";',
    ' for(let i=0; i<es.length; i++) { es[i].setAttribute("o", v); }',
    ' es = document.querySelectorAll(".oo > span");',
    ' for(let i=0; i<es.length; i++) {',
    '  if(v != 1) {',
	'   es[i].style.background = null;',
	'   es[i].style.boxShadow = null; continue; }',
    '  let c = getComputedStyle(es[i]).getPropertyValue("border-color");',
    '  es[i].style.background = c.replace("rgb(", "rgba(").replace(")", ",0.2)");',
    '  es[i].style.boxShadow = "1px 1px 0 0 " + c + ",-1px -1px 0 0 " + c + ",1px -1px 0 0 " + c + ",-1px 1px 0 0 " + c;',
    ' }',
    ' es = document.querySelectorAll(".o"); if(es.length <= 0) return;',
    ' for(let i=0; i<es.length; i++) { es[i].setAttribute("o", v); }',
    ' es = document.querySelectorAll(".o > span");',
    ' for(let i=0; i<es.length; i++) {',
    '  if(v != 1) {',
	'   es[i].style.background = null;',
	'   es[i].style.boxShadow = null; continue; }',
    '  let c = getComputedStyle(es[i]).getPropertyValue("border-color");',
    '  es[i].style.background = c.replace("rgb(", "rgba(").replace(")", ",0.2)");',
    '  es[i].style.boxShadow = "1px 1px 0 0 " + c + ",-1px -1px 0 0 " + c + ",1px -1px 0 0 " + c + ",-1px 1px 0 0 " + c;',
    ' } }',
    '</script>',
    '<title>' + title + '</title>',
    '</head><body>',
    ].join('\n')  + '\n'
};
const guide = function (title, gline, cmode) {
    return [
    '<div id=cbox onclick="gbox_show()">&#x1F56E</div>',
    '<div id=gbox style="display:none;"><div>' + title + '</div>',
	'<div id=gline>',
	gline.join('\n'),
	'</div>',
	'<div onclick="gbox_cmode()" style="border-top:1px solid #ccc;">'
	+ '<span id=cmode><span id=gcheck class=""></span></span> '
	+ cmode + '</div>',
	'</div>',
    ].join('\n')  + '\n'
};
const footer = function () {
    return [
    '</body></html>',
    ].join('\n') + '\n';
};

module.exports = {
    format: format
};
