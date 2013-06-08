// double link to make it a typical undirected graph
var doubleLinks = function (link) {
    "use strict";
    var links = [], i = 0, ll = 0;
    for (i = 0, ll = link.length; i < ll; i = i + 1) {
        links.push([link[i][1], link[i][0]]);
        links.push(link[i]);
    }
    return links;
};

// remove repeated elements in an array
var unique = function (orig) {
    "use strict";
    var a = [];
    orig.forEach(function(item, idx, array){
        if (-1 === a.indexOf(item)){
            a.push(item);
        }
    });
    return a;
};

var strToJson = function (str) {
    return (new Function("return " + str))();
};

var getConnected = function (father, link, visited) {  // father is the 2nd element of link
    "use strict";
    var son = [], i = 0;
    for (i in link) {
        if (father.indexOf(link[i][1]) > -1 && (visited.indexOf(link[i][0]) === -1)) {
            son.push(link[i][0]);
        }
    }
    if (son.length > 0) {
        return unique(son);
    } else {
        return undefined;
    }
};

/*
 * define father and son relationship according to links.
 * set father to be -1, if none father node connected to son.
 */
var father_son = function (upperLevel, lowerLevel, links) {
    "use strict";
    var res = {}, father = '', son = '',
        link2 = doubleLinks(links);
    for (var link in link2) {
        son = link2[link][0];
        father = link2[link][1];
        if ((upperLevel.indexOf(father) > -1) && (lowerLevel.indexOf(son) > -1)) {
            if (!res[father]) {
                res[father] = [son];
            } else if (res[father].indexOf(son) === -1) {
                res[father].push(son);
            }
        }
    }
    return res;
}

/*
 * sort facility in the same layer to avoid cross lines.
 * input: subOvs/subHost = {'father1':[son1, son2, ...], father2: [son1, son2, ...]}
 *        fatherSeq = node sequence of last layer
 * if there are both ovs and host under a ovs, put ovs in the middle surrounding with hosts
 * fatherSeq can not be empty for subOvs and subHost data structure needs it.
 */
var sort = function(subHost, subOvs, fatherSeq) {

    var seq = [], host = [], ovs = [], mid = 0;
    for (var i = 0; i < fatherSeq.length; i++){
        var father = fatherSeq[i];
        host = subHost[father] || [];
        ovs = subOvs[father] || [];
        if (host && ovs){
            mid = Math.ceil(host.length* 0.5);
            seq = seq.concat(host.slice(0, mid))
            seq = seq.concat(ovs)
            seq = seq.concat(host.slice(mid))
        }
    }
    return unique(seq);
}

var getDegrees = function(edges) {
    "use strict";
    var degree = {}, node = 0;
    for (var i in edges){
        for (var j in edges[i]) {
            node = edges[i][j];
            if (!degree[node]) {
                degree[node] = 1;
            } else {
                degree[node] = degree[node] + 1;
            }
        }
    }
    return degree;
}
