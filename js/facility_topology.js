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
        pic_width: 120,
    },
    PIC_PATH: ''
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
    //fsTop.links_fl = [['FL01', '00:01'], ['FL02', '00:02'], ['FL03', '00:13']];
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
    fsTop.PIC_PATH = '../img/';
}

function init(islandId) {
    "use strict";
    var node = 0, degree = {};
    var topology_url = 'http://' + window.location.host + "/facility_topology/"+islandId+"/";
    $.ajaxSetup({
        async : false
    });
    $.get(topology_url, function(responseTxt,statusTxt,xhr) {
        if (statusTxt === "success") {
            responseTxt = strToJson(responseTxt);
            fsTop.nodes_flowvisor = responseTxt.flowvisor || [];
            fsTop.nodes_ovs = responseTxt.ovs || [];
            fsTop.nodes_host_all = responseTxt.host || [];
            fsTop.links_fl = responseTxt.linkFlowvisor || [];
            fsTop.links_ovs = responseTxt.linkOvs || [];
            fsTop.links_host = responseTxt.linkHost || [];
        } else if (statusTxt === "error") {
            alert("Error ovs: "+xhr.status+": "+xhr.statusText);
        }
    })
        .success(function () {})
        .error(function () {})
        .complete(function () {});

    fsTop.PIC_PATH = '/static/topology/img/';
    // get degree
}

// set root. return {rootName: [node set]}
var getRoot = function (visited) {
    "use strict";
    if (visited === 0) {
        if (fsTop.nodes_flowvisor.length > 0) {
            return getConnected(fsTop.nodes_flowvisor, fsTop.links_fl, []);
        }
        visited = [];
    }
    return getRootId1(visited);
};

var getRootId1 = function (visited) {  // max degree
    var degrees   = getDegrees(fsTop.links_ovs),
        maxId     = -1,
        maxDegree = -1;

    for (var i in fsTop.nodes_ovs){
        if (visited.indexOf(fsTop.nodes_ovs[i]) === -1){
            dg = degrees[fsTop.nodes_ovs[i]] || 0;
            if (dg > maxDegree) {
                maxDegree = dg;
                maxId = [fsTop.nodes_ovs[i]];
            }
        }
    }
    return maxId
};

// generate flowvisor/ovs/host tree with breadth first search
var bfs = function(){
    /*
     * flowvisor is set as root on the same level if exist, and go on searching for ovs and host.
     * if none flowvisor available and there are ovs/host unvisited,
     * ovs with maximum degree is set as root and choose the first one if there is more than one maximum value.
     *
     * results are saved in ovsTree/hostTree/rootSeq.
     * flowvisor is saved in rootSeq if exists.
     */
    var ovsTree      = {},
        hostTree     = {}, // rootId: [nodesInLvl0, nodesInLvl1,...]
        rootSeq      = [],  // sequence to plot 
        visited_ovs  = [],
        visited_host = [],
        visited_fl   = 0,
        roots        = [],
        father       = [],
        hosts        = [];

    roots = getRoot(visited_fl);  // dict
    while (roots != -1) { // available tree. empty dict
        rootSeq.push(roots);
        rootIdx = rootSeq.indexOf(roots);

        father = roots, ovsTree[rootIdx] = [], hostTree[rootIdx] = [];
        while(father.length > 0) {
            ovsTree[rootIdx].push(father);  // insert ovs into tree
            visited_ovs = visited_ovs.concat(father);
            hosts = getConnected(father, fsTop.links_host, visited_host);
            hostTree[rootIdx].push(hosts);  // insert host into tree
            visited_host = visited_host.concat(hosts);

            father = getConnected(father, fsTop.links_ovs, visited_ovs);
        }
        roots = getRoot(visited_ovs);  // next tree
    }

    // add empty host to the tree
    roots = [];
    rootSeq.push(roots);
    rootIdx = rootSeq.indexOf(roots);
    ovsTree[rootIdx] = [];
    hostTree[rootIdx] = [fsTop.hosts_empty];

    return {'ovs': ovsTree, 'host': hostTree, 'treeSeq': rootSeq};
}

// 管理节点的坐标信息
function axisTree (obj, width, delta_y) {
    "use strict";
    this.base_x = obj.offset().left + fsTop.nodes_pic.pic_width*0.5;
    this.base_y = obj.offset().top + fsTop.nodes_pic.pic_height*0.5;
    this.maxWidth = obj.width()
    this.width = this.maxWidth * width - fsTop.nodes_pic.pic_width;
    this.delta_y = delta_y;
    this.max_x = this.base_x;
    this.max_y = 200;
    this['ovs'] = {};
    this['host'] = {};
    this['flowvisor'] = {};
}
axisTree.prototype={
    setOvsLine: function(seqNode, level, seq){
        "use strict";
        var x = 0,
            y = 0;
        for(var i = 0, len = seqNode.length; i < len; i++){
            x = this.base_x + (seq.indexOf(seqNode[i])+1) * this.width/(seq.length+1);
            y = this.base_y + (level+1) * this.delta_y;
            this['ovs'][seqNode[i]]= [x, y];
        }
        this.max_x = (this.max_x > x) ? this.max_x : x;
        this.max_y = (this.max_y > y) ? this.max_y : y;
    },

    setHostLine: function(seqNode, level, seq){
        "use strict";
        var x = 0, y = 0;
        for(var i = 0, len = seqNode.length; i < len; i++){
            x = this.base_x + (seq.indexOf(seqNode[i])+1) * this.width/(seq.length+1);
            y = this.base_y + (level + 0.6) * this.delta_y;
            this['host'][seqNode[i]]=[x, y];
        }
        this.max_x = (this.max_x > x) ? this.max_x : x;
        this.max_y = (this.max_y > y) ? this.max_y : y;
    },

    setFlowvisorLine: function(seqNode, seq){
        "use strict";
        var x = 0, y = 0;
        for(var i = 0, len = seqNode.length; i < len; i++){
            x = this.base_x + (seq.indexOf(seqNode[i])+1) * this.width/(seq.length+1);
            y = this.base_y
            this['flowvisor'][seqNode[i]]= [x, y];
        }
        this.max_x = (this.max_x > x) ? this.max_x : x;
        this.max_y = (this.max_y > y) ? this.max_y : y;
    },
}

function getRelativeWidth(roots, ovsTree, hostTree, n_fv){
    var nTree = roots.length,
        max   = [],
        nLvl  = [],
        lenLvl, root, lvl;

    for (root = 0; root < nTree; root += 1){  // init by length root
        max[root] = roots[root].length;
    }
    max[0] = n_fv > max[0]? n_fv : max[0];

    for (root = 0; root < nTree; root += 1){
        for (var j = 0; j < ovsTree[root].length + 1; j += 1){
            lenLvl = (ovsTree[root][j]||[]).length + (hostTree[root][j]||[]).length;
            max[root] = lenLvl > max[root]? lenLvl : max[root];
        }
    }
    sum = 0;
    for (root = 0; root < nTree; root +=1){
        sum += max[root];
    }
    for (root = 0; root < nTree; root +=1){
        max[root] = max[root]/sum;
    }
    return max
}

// 根据树的结构计算各节点的坐标。
function plot(obj, ovsTree, hostTree, treeRootSeq){
    "use strict";
    /*
     * 树的结构参数，主要涉及：每层的节点数，相邻两层节点之间的父子关系。
     * 若存在多棵树，在 treeRootSeq 中指定做图的顺序。
     * TODO: 做图顺序动态计算，且不一定为横排放置。参考内存分配算法.
     * 输入：ovsTree = {root1: {0:[ovs1, ovs2, host1, ...], 1: [ovs3], ...}, root2: {}}
     * 输出：treeLayout = {axis_ovs: {...}, aixs_host: {...}}
     */
    var fatherSeq = [], ovs_level = [], host_level = [],  // 分层信息
        subOvs = {}, subHost = {}, seq = 0,  // 层间父子关系与排序后的序列
        treeWidth = getRelativeWidth(treeRootSeq, ovsTree, hostTree, fsTop.nodes_flowvisor.length, fsTop.hosts_empty.length),
        treeLayout = new axisTree(obj, treeWidth[0], fsTop.nodes_pic.pic_height);  // 初始化子画布。

    treeLayout.setFlowvisorLine(fsTop.nodes_flowvisor, fsTop.nodes_flowvisor);

    for (var root in treeRootSeq){// 做图顺序
        treeLayout.width = treeLayout.maxWidth * treeWidth[root] - fsTop.nodes_pic.pic_width;  // move pointer for next tree

        fatherSeq = treeRootSeq[root];  // root is ovs
        if (root === 0) {  // first level, father is flowvisor, sorted need
            subOvs = father_son(fsTop.nodes_flowvisor, fatherSeq, fsTop.links_fl)
            fatherSeq = sort({}, subOvs, fsTop.nodes_flowvisor);
        } 
        seq = fatherSeq;  // no more sort needed
        treeLayout.setOvsLine(fatherSeq, 0, seq);

        for (var line = 1; fatherSeq.length > 0; line++){
            host_level = (hostTree[root] && hostTree[root][line-1]) || [];
            ovs_level = ovsTree[root][line] || [];
            subOvs = father_son(fatherSeq, ovs_level, fsTop.links_ovs);
            subHost = father_son(fatherSeq, host_level, fsTop.links_host);
            seq = sort(subHost, subOvs, fatherSeq);

            // 根据排序结果和所在层数，计算横纵坐标
            treeLayout.setOvsLine(ovs_level, line, seq);
            treeLayout.setHostLine(host_level, line, seq);
            
            fatherSeq = sort({}, subOvs, fatherSeq);  // father of next loop
        }
        treeLayout.base_x = treeLayout.max_x+fsTop.nodes_pic.pic_width;  // move pointer for next tree
        //console.log(treeLayout.base_x)
    }

    treeLayout.setHostLine(fsTop.hosts_empty, 1, fsTop.hosts_empty);  // empty host

    obj.css("height",treeLayout.max_y + fsTop.nodes_pic.pic_height);
    return treeLayout;
}

// 根据节点坐标计算线的坐标
function drawLine(axis_ovs, axis_host, axis_flowvisor){  // unify in one array
    var axis_links = [];
    for(var i = 0; i < fsTop.links_ovs.length; i++){  // lines between ovs and ovs
        var from=axis_ovs[fsTop.links_ovs[i][0]],to=axis_ovs[fsTop.links_ovs[i][1]];
        axis_links.push([from[0],from[1],to[0],to[1]]);
    }
    for(var i in fsTop.links_host){  // lines between ovs and host
        var to=axis_host[fsTop.links_host[i][0]],from=axis_ovs[fsTop.links_host[i][1]];
        axis_links.push([from[0],from[1],to[0],to[1]]);
    }
    for(var i in fsTop.links_fl){  // lines between ovs and flowvisor
        var to=axis_flowvisor[fsTop.links_fl[i][1]],from=axis_ovs[fsTop.links_fl[i][0]];
        axis_links.push([from[0],from[1],to[0],to[1]]);
    }
    return axis_links;
}

// generate html code according to coordinate of nodes and lines.
var display = function(container, vertex, edge){
    "use strict";
    $(container).append("<svg>"+add_vertexs(vertex)+add_edges('edge',edge)+"</svg>");
}

// coordinates = {nodeType: {nodeId:[x,y]}}
var add_vertexs = function(coordinates){
    "use strict";
    // only fsTop.PIC_PATH, fsTop.nodes_pic.width/heght is used
    var coordinate, x, y, nodeId, nodeType, html;
    for (nodeType in coordinates){
        for (nodeId in coordinates[nodeType]){
            coordinate = coordinates[nodeType][nodeId];
            x = coordinate[0] - fsTop.nodes_pic.pic_width * 0.5;
            y = coordinate[1] - fsTop.nodes_pic.pic_height * 0.5;
            html += " <a xlink:href='/host/overview/"+nodeId+"' target='new'><image class=" + nodeType + " xlink:href='"+fsTop.PIC_PATH+nodeType+".png' x='" + x + "' y='"+y+"' width='"+fsTop.nodes_pic.pic_width+"'height='" +fsTop.nodes_pic.pic_height+"'></a>"; 
        }
    }
    return html;
}

// coordinates = {edgeId:[x1,y1,x2,y2]}
var add_edges = function(edgeType, coordinates) {
    "use strict";
    var coordinate, edgeId, html;
    for (var edgeId in coordinates){
        coordinate = coordinates[edgeId]
        html += "<line class='"+edgeType+"' x1='"+coordinate[0]+"' y1='"+coordinate[1]+"' x2='"+coordinate[2]+"' y2='"+coordinate[3]+"'></line>";
    }
    return html;
}

// 主流程
function draw (origObj) {

    var trees = bfs();
    var hostTree = trees['host'];
    var ovsTree = trees['ovs'];
    var treeRootSeq = trees['treeSeq']

    // calculate coordinate according to tree info
    var axis_nodes = plot($(origObj), ovsTree, hostTree, treeRootSeq);
    var axis_links = drawLine(axis_nodes['ovs'], axis_nodes['host'], axis_nodes['flowvisor']);

    // generate html according to coordinate
    display(origObj, axis_nodes, axis_links);
}

// 程序入口
$(document).ready(function() {
    /(\d+)/g.test(window.location.pathname);
    //init(RegExp.$1);  // get data from host
    initCircleTemp();  // test data

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
    draw("div#facility_content");
});
