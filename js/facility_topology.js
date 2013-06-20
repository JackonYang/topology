/*
 * description: draw topology with tree data structue
 *     if it is not a tree, there would be some cross lines 
 *     which may resultt in poor visual impact.
 * author: jiekunyang@gmail.com
 * input: nodesId, edge between nodesId.
 * output: html page contains topology info of the nodes.
 * algorithm: calculate coordinate of nodes first, and then that of lines.
 *           there are 3 data structures to save tree info of nodes.
 *              1. root, which can be any of flowvisor, ovs or host. plot seq is controlled here.
 *              2. ovsTree saves ovs except ovses included in root.
 *              3. hostTree saves host except hosts included in root.
 *           and there are another 1 data structure to data coordinate of nodes, specified by nodeType.
 * notes: for switch is a keyword of js, use ovs instead of switch to represented for switches.
 */

// global namespace
var fsTop = {
    nodes_flowvisor: [],
    nodes_ovs: [], // array of ovsId
    nodes_host_all: [],
    nodes_host: [],  // array of hostId
    hosts_empty: [],  // array of hostId
    links_fl: [],
    links_ovs: [],  // array of [from, to]
    links_host: [], // array of [from, to]
    nodes_pic: {  // width and height of picture
        pic_height: 120,
        pic_width: 120
    }
};

var doubleLinks = function (link) {
    "use strict";
    return link.map(function (item) {
        return [item[1], item[0]];
    }).concat(link);
};

var strToJson = function (str) {
    return (Function("return " + str))();
};

var unique = function (orig) {
    "use strict";
    var a = [];
    orig.forEach(function (item) {
        if (-1 === a.indexOf(item)) {
            a.push(item);
        }
    });
    return a;
};

var minus = function (a, b) {
    "use strict";
    return unique(a).filter(function (item) {
        return (a.indexOf(item) > -1) && (-1 === b.indexOf(item));
    });
};

var getConnected = function (father, link, visited) {
    "use strict";
    // father is the 2nd element of link
    var son = [];
    link.forEach(function (item) {
        if (father.indexOf(item[1]) > -1
                && (-1 === visited.indexOf(item[0]))) {
            son.push(item[0]);
        }
    });
    if (0 === son.length) {
        return undefined;
    }
    return unique(son);
};

var getDegrees = function (edges) {
    "use strict";
    var degree = {};
    edges.forEach(function (edge) {
        edge.forEach(function (node) {
            degree[node] = (degree[node] || 0) + 1;
        });
    });
    return degree;
};

var father_son = function (upperLevel, lowerLevel, links) {
    "use strict";
    var res   = {};

    doubleLinks(links).forEach(function (link) {
        var father = link[1],
            son    = link[0];
        if ((upperLevel.indexOf(father) > -1) && (lowerLevel.indexOf(son) > -1)) {
            if (!res[father]) {
                res[father] = [son];
            } else if (res[father].indexOf(son) === -1) {
                res[father].push(son);
            }
        }
    });
    return res;
};

/*
 * sort facility in the same layer to avoid cross lines.
 * input: subOvs/subHost = {'father1':[son1, son2, ...], father2: [son1, son2, ...]}
 *        fatherSeq = node sequence of last layer
 * if there are both ovs and host under a ovs, put ovs in the middle surrounding with hosts
 */
var sort = function (subHost, subOvs, fatherSeq) {
    "use strict";
    var seq = [],
        host,
        ovs,
        mid;
    fatherSeq.forEach(function (father) {
        host = subHost[father] || [];
        ovs = subOvs[father] || [];
        if (host && ovs) {
            mid = Math.ceil(host.length * 0.5);
            seq = seq.concat(host.slice(0, mid));
            seq = seq.concat(ovs);
            seq = seq.concat(host.slice(mid));
        }
    });
    return unique(seq);
}

// init data
function initCircleTemp() {
    "use strict";
    // nodes 
    fsTop.nodes_flowvisor = ["FL01", "FL02", "FL03"];
    fsTop.nodes_ovs = ["00:01", "00:02", "00:03", "00:04", "00:05",
                 "00:06", "00:07", "00:08", "00:09", "00:10",
                 "00:11", "00:13", "00:14", "00:15", "00:16",
                 "00:17"];
    fsTop.nodes_host_all = ["HOSTM1", "HOSTM2", "HOST01", "HOST02", "HOST03",
                    "HOST04", "HOST05", "HOST06", "HOST07", "HOST08",
                    "HOST09", "HOST10", "HOST11", "HOST12", "HOST13", "HOST_EMPTY12", "HOST_EMPTY13"];
    // links 
    fsTop.links_fl = [['00:01', "FL01"], ['00:02', "FL02"], ['00:13', "FL03"]];
    fsTop.links_ovs = [["00:01", "00:03"], ["00:02", "00:03"], ["00:04", "00:06"],
                 ["00:05", "00:06"], ["00:03", "00:06"], ["00:03", "00:07"],
                 ["00:06", "00:08"], ["00:08", "00:09"], ["00:08", "00:10"],
                 ["00:10", "00:11"], ["00:07", "00:08"], ["00:13", "00:14"],
                 ["00:13", "00:15"], ["00:13", "00:16"], ["00:14", "00:15"],
                 ["00:14", "00:16"], ["00:15", "00:16"]];
    fsTop.links_host = [["HOST01", "00:01"], ["HOST02", "00:01"],
        ["HOST03", "00:01"], ["HOST04", "00:01"], ["HOST05", "00:03"],
        ["HOST06", "00:05"], ["HOST07", "00:05"], ["HOST08", "00:05"],
        ["HOST09", "00:09"], ["HOST10", "00:13"], ["HOST11", "00:14"],
        ["HOST12", "00:14"], ["HOST13", "00:16"], ["HOSTM1", "00:01"],
        ["HOSTM2", "00:05"], ["HOSTM1", "00:03"], ["HOSTM1", "00:09"],
        ["HOSTM2", "00:11"], ["HOSTM2", "00:08"], ["HOSTM2", "00:13"]];
}

function init(islandId) {
    "use strict";
    var url = 'http://' + window.location.host + "/facility_topology/" + islandId + "/",
        node = 0,
        degree = {};

    $.ajaxSetup({
        async : false  // 必须同步，后来的计算依赖与数据
    });

    $.get(url, function success (responseTxt, statusTxt, xhr) {
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
            responseTxt = strToJson(responseTxt);
            fsTop.nodes_flowvisor = responseTxt.flowvisor || [];
            fsTop.nodes_ovs = responseTxt.ovs || [];
            fsTop.nodes_host_all = responseTxt.host || [];
            fsTop.links_fl = responseTxt.linkFlowvisor || [];
            fsTop.links_ovs = responseTxt.linkOvs || [];
            fsTop.links_host = responseTxt.linkHost || [];
        } else {
            console.log('response text error');
            console.log(xhr);
        }
    })
        .success(function (rspText) {
            console.log("response text: " + rspText);
        })  // request data success, log for debug.
        .error(function () {
            console.log('data error');
        });  // url error, 404, log for debug
}

var getRootId1 = function (visited) {  // max degree
    "use strict";
    var degrees   = getDegrees(fsTop.links_ovs),
        maxDegree = -1,
        maxId,
        i,
        dg;

    for (i in fsTop.nodes_ovs) {
        if (visited.indexOf(fsTop.nodes_ovs[i]) === -1) {
            dg = degrees[fsTop.nodes_ovs[i]] || 0;
            if (dg > maxDegree) {
                maxDegree = dg;
                maxId = [fsTop.nodes_ovs[i]];
            }
        }
    }
    return maxId;
};

// set root. return {rootName: [node set]}
var getRootIds = function (visited) {
    "use strict";
    return getConnected(fsTop.nodes_flowvisor, fsTop.links_fl, visited) || getRootId1(visited);
};

// generate flowvisor/ovs/host tree with breadth first search
var bfs = function () {
    "use strict";
    /*
     * All flowvisor are set as root on the same level if exist, Ovs and host come after flowvisor
     * if none flowvisor available and there are ovs/host unvisited,
     * ovs with maximum degree is set as root and choose the first one if there is more than one maximum value.
     * results are saved in ovsTree/hostTree/rootSeq.
     */
    var ovsTree      = {},
        hostTree     = {}, // rootId: [nodesInLvl0, nodesInLvl1,...]
        rootSeq      = [],  // sequence to plot 
        visited_ovs  = [],
        visited_host = [],
        roots        = [],
        father       = [],
        rootIdx      = -1,
        hosts        = [];

    roots = getRootIds(visited_ovs);  // dict
    while (roots) { // available tree. empty dict
        rootSeq.push(roots);
        rootIdx = rootSeq.indexOf(roots);

        // 初始化树
        father = roots;
        ovsTree[rootIdx] = [];
        hostTree[rootIdx] = [];
        // 遍历节点
        while (father) {
            ovsTree[rootIdx].push(father);  // insert ovs into tree
            visited_ovs = visited_ovs.concat(father);
            hosts = getConnected(father, fsTop.links_host, visited_host) || [];
            hostTree[rootIdx].push(hosts);  // insert host into tree
            visited_host = visited_host.concat(hosts);

            father = getConnected(father, fsTop.links_ovs, visited_ovs);
        }

        roots = getRootIds(visited_ovs);  // next tree
    }

    fsTop.hosts_empty = minus(fsTop.nodes_host_all, visited_host);

    console.log({'ovs': ovsTree, 'host': hostTree, 'treeSeq': rootSeq});
    return {'ovs': ovsTree, 'host': hostTree, 'treeSeq': rootSeq};
}

function drawer (base, maxWidth, delta_y, treesWidth) {
    "use strict";
    /*
     * 参考点base(x, y), 最大max(x, y), 树宽，高度浮动.
     */

    this.treesWidth = treesWidth.map(function (item){
        return maxWidth * item;
    });
    this.maxWidth = maxWidth;
    this.delta_y = delta_y;

    this.idx = 0;
    this.base = [base.left, base.top + delta_y*0.5];
    this.width = this.treesWidth[this.idx];
    this.max_y = 200;

    this['ovs'] = {};
    this['host'] = {};
    this['flowvisor'] = {};
}
drawer.prototype={
    setOvsLine: function(seqNode, level, seq){
        "use strict";
        var x = 0,
            y = 0;
        for(var i = 0, len = seqNode.length; i < len; i++){
            x = this.base[0] + (seq.indexOf(seqNode[i]) + 1) * this.width/(seq.length+1);
            y = this.base[1] + (level+1) * this.delta_y;
            this['ovs'][seqNode[i]]= [x, y];
        }
        this.max_y = (this.max_y > y) ? this.max_y : y;
    },

    setHostLine: function(seqNode, level, seq){
        "use strict";
        var x = 0, y = 0;
        for(var i = 0, len = seqNode.length; i < len; i++){
            x = this.base[0] + (seq.indexOf(seqNode[i]) + 1) * this.width/(seq.length+1);
            y = this.base[1] + (level + 0.6) * this.delta_y;
            this['host'][seqNode[i]]=[x, y];
        }
        this.max_y = (this.max_y > y) ? this.max_y : y;
    },

    setFlowvisorLine: function(seqNode){
        "use strict";
        var x = 0, y = 0,
            seq = seqNode;
        for(var i = 0, len = seqNode.length; i < len; i++){
            x = this.base[0] + (seq.indexOf(seqNode[i])+1) * this.width/(seq.length+1);
            y = this.base[1];
            this['flowvisor'][seqNode[i]]= [x, y];
        }
        this.max_y = (this.max_y > y) ? this.max_y : y;
    },

    nextTree: function (){  // set base/max info of next tree
        this.idx += 1;
        this.base[0] += this.width;  // move pointer for next tree
        this.width = this.treesWidth[this.idx];
    }
}

function getRelativeWidth(roots, ovsTree, hostTree, n_fv){
    "use strict";
    var sum   = 0,
        max = roots.map(function (item) {
            return item.length;
        });

    max[0] = n_fv > max[0]? n_fv : max[0];
    max.forEach(function (item, i){
        var lenLvl,
            j;
        for (var j = 0; j < ovsTree[i].length + 1; j += 1){
            lenLvl = (ovsTree[i][j+1]||[]).length + (hostTree[i][j]||[]).length;
            max[i] = lenLvl > max[i]? lenLvl : max[i];
        }
    });

    max.push(fsTop.hosts_empty.length);
    max.forEach(function (item){
        sum += item;
    });
    return max.map(function (item){
        return item/sum;
    });
}

// 根据树的结构计算各节点的坐标。
function plot(obj, treeRootSeq, ovsTree, hostTree){
    "use strict";
    /*
     * 根据 treeRootSeq 中确定的顺序，遍历每一棵树并计算每一层各节点的坐标。
     * 计算每一层坐标时，根据父节点的位置确定层内的位置，从而避免交叠线。
     * @param ovsTree = {root1: {0:[ovs1, ovs2, host1, ...], 1: [ovs3], ...}, root2: {}}
     */
    var treeWidth = getRelativeWidth(treeRootSeq, ovsTree, hostTree, fsTop.nodes_flowvisor.length),
        treeLayout = new drawer(obj.offset(), obj.width(), fsTop.nodes_pic.pic_height, treeWidth),  // 初始化子画布。
        fatherSeq = [], ovs_level = [], host_level = [], levels,  // 分层信息
        subOvs = {}, subHost = {}, seq = 0;  // 层间父子关系与排序后的序列

    for (var root in treeRootSeq){// 做图顺序
        fatherSeq = treeRootSeq[root];  // root is ovs
        if (root === '0') {  // first level, father is flowvisor, sorted need
            treeLayout.setFlowvisorLine(fsTop.nodes_flowvisor);
            if (fsTop.links_fl.length > 0) {
                subOvs = father_son(fsTop.nodes_flowvisor, fatherSeq, fsTop.links_fl)
                fatherSeq = sort({}, subOvs, fsTop.nodes_flowvisor);
            }
        } 
        seq = fatherSeq;  // no more sort needed
        treeLayout.setOvsLine(fatherSeq, 0, seq);

        levels = ovsTree[root].length + 2;
        for (var line = 1; line < levels; line += 1){
            host_level = (hostTree[root] && hostTree[root][line-1]) || [];
            ovs_level = (ovsTree[root] && ovsTree[root][line]) || [];
            subOvs = father_son(fatherSeq, ovs_level, fsTop.links_ovs);
            subHost = father_son(fatherSeq, host_level, fsTop.links_host);
            seq = sort(subHost, subOvs, fatherSeq);

            // 根据排序结果和所在层数，计算横纵坐标
            treeLayout.setOvsLine(ovs_level, line, seq);
            treeLayout.setHostLine(host_level, line, seq);
            
            fatherSeq = sort({}, subOvs, fatherSeq);  // father of next loop
        }
        treeLayout.nextTree();
    }

    treeLayout.setHostLine(fsTop.hosts_empty, 1, fsTop.hosts_empty);  // empty host
    obj.css("height", treeLayout.max_y + fsTop.nodes_pic.pic_height);

    return {'flowvisor': treeLayout['flowvisor'], 'ovs': treeLayout['ovs'], 'host': treeLayout['host']};
}

// generate html source code according to link info of edges and coordinate of nodes.
var show = function(vertex, edge, vertexBox, PIC_PATH){
    "use strict";
    /*
     * @param vertex: {vertexType:{vertexId: [x, y]}}
     * @param edge: [ [from, to], ...]
     * @param vertexBox: [width, height]
     * @param PIC_PATH: string. Ending with '/' is a must.
     * return html: string
     */

    var html = '',
        nodes = {};
    // nodes
    (function () {
        var nodeType,
            nodeId,
            coordinate,
            x, y;
        for (nodeType in vertex) {
            if (vertex.hasOwnProperty(nodeType)) {
                $.extend(nodes, vertex[nodeType]);
                for (nodeId in vertex[nodeType]){
                    if (vertex[nodeType].hasOwnProperty(nodeId)) {
                        coordinate = vertex[nodeType][nodeId];
                        x = coordinate[0] - vertexBox.width * 0.5;
                        y = coordinate[1] - vertexBox.height * 0.5;
                        html += ["<a xlink:href='/host/overview/", nodeId, "' target='new'>",
                            "<image xlink:href='" , PIC_PATH , nodeType , ".png' ", "x='", x, "' y='", y, "'",
                            "width='", vertexBox.width, "'height='", vertexBox.height, "'>", "</a>"].join(''); 
                    }
                }
            }
        }
    })();
    // edge
    edge.forEach(function (item) {
        var from = nodes[item[0]],
            to = nodes[item[1]];
        if (from && to) {
            html += [
                "<line class='edge' x1='", from[0], "' y1='", from[1], "' x2='", to[0], "' y2='", to[1], "'></line>"
            ].join('');
        }
    });

    return ["<svg height=100% width=100%>", html, "</svg>"].join('');
}

// 主流程
function draw (obj, PIC_PATH) {

    var trees = bfs(),
        hostTree = trees['host'],
        ovsTree = trees['ovs'],
        treeRootSeq = trees['treeSeq'],
        links = [],
        axis_nodes = plot(obj, treeRootSeq, ovsTree, hostTree);

    links = links.concat(fsTop.links_ovs).concat(fsTop.links_host).concat(fsTop.links_fl);
    obj.append(show(axis_nodes, links, {'width': 120, 'height': 120}, PIC_PATH));
}

// 程序入口
$(document).ready(function () {
    /*
     * 获取数据，树结构，呈现树，其他事件监听（窗口大小改变）
     */
    var PIC_PATH;
    // request data
    if (location.protocol === 'file:') {  // auto test in qnit, do nothing here.
        initCircleTemp();  // test data
        PIC_PATH = '../img/';
    } else {
        /(\d+)/g.test(location.pathname);
        init(RegExp.$1);  // get data from server
        PIC_PATH = '/static/topology/img/';

    }
    // init host info
    degree = getDegrees(fsTop.links_host);
    for (var i in fsTop.nodes_host_all){
        node = fsTop.nodes_host_all[i];
        if (degree[node] && degree[node] > 0) {
            fsTop.nodes_host.push(node);
        } else {
            fsTop.hosts_empty.push(node);
        }
    }
    fsTop.nodes_host = fsTop.nodes_host.concat(fsTop.hosts_empty);
    fsTop.links_ovs = doubleLinks(fsTop.links_ovs)

    // div info
    draw($("div#facility_content"), PIC_PATH);
});
