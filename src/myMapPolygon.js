/**
 * 该例子提供基于多边形重叠合并算法 
 * 基于Baidu Map API
 *
 * @author arvin
 */

/** 
 * @namespace BMap的所有library类均放在BMapLib命名空间下
 */
var BMapLib = window.BMapLib = BMapLib || {};
(function() {

    var polygonCtrl =
        /**
         * 并入BMapLib方法
         */
        BMapLib.polygonCtrl =
        /**
         * 并入全局对象
         */
        window.myMapPolygon = function() {}

    /**
     * [isPointInRect 判断点是否在矩形内]
     * @param  {[type]}  point  [点对象]
     * @param  {[type]}  bounds [矩形边界对象]
     * @return {Boolean}        [点在矩形内返回true,否则返回false]
     */
    polygonCtrl.isPointInRect = function(point, bounds) {
        //检查类型是否正确
        if (!(point instanceof BMap.Point) ||
            !(bounds instanceof BMap.Bounds)) {
            return false;
        }
        var sw = bounds.getSouthWest(); //西南脚点
        var ne = bounds.getNorthEast(); //东北脚点
        return (point.lng >= sw.lng && point.lng <= ne.lng && point.lat >= sw.lat && point.lat <= ne.lat);
    }

    /**
     * [isPointInPolygon 判断点是否多边形内]
     * @param  {[type]}  point   [点对象]
     * @param  {[type]}  polygon [多边形对象]
     * @return {Boolean}         [点在多边形内返回true,否则返回false]
     */
    polygonCtrl.isPointInPolygon = function(point, polygon) { //检查类型

        if (!(point instanceof BMap.Point) ||
            !(polygon instanceof BMap.Polygon)) {
            return false;
        }

        //首先判断点是否在多边形的外包矩形内，如果在，则进一步判断，否则返回false
        var polygonBounds = polygon.getBounds();
        if (!this.isPointInRect(point, polygonBounds)) {
            return false;
        }

        var pts = polygon.getPath(); //获取多边形点

        //下述代码来源：http://paulbourke.net/geometry/insidepoly/，进行了部分修改
        //基本思想是利用射线法，计算射线与多边形各边的交点，如果是偶数，则点在多边形外，否则
        //在多边形内。还会考虑一些特殊情况，如点在多边形顶点上，点在多边形边上等特殊情况。

        var N = pts.length;
        var boundOrVertex = true; //如果点位于多边形的顶点或边上，也算做点在多边形内，直接返回true
        var intersectCount = 0; //cross points count of x 
        var precision = 2e-10; //浮点类型计算时候与0比较时候的容差
        var p1, p2; //neighbour bound vertices
        var p = point; //测试点

        p1 = pts[0]; //left vertex        
        for (var i = 1; i <= N; ++i) { //check all rays            
            if (p.equals(p1)) {
                return boundOrVertex; //p is an vertex
            }

            p2 = pts[i % N]; //right vertex            
            if (p.lat < Math.min(p1.lat, p2.lat) || p.lat > Math.max(p1.lat, p2.lat)) { //ray is outside of our interests                
                p1 = p2;
                continue; //next ray left point
            }

            if (p.lat > Math.min(p1.lat, p2.lat) && p.lat < Math.max(p1.lat, p2.lat)) { //ray is crossing over by the algorithm (common part of)
                if (p.lng <= Math.max(p1.lng, p2.lng)) { //x is before of ray                    
                    if (p1.lat == p2.lat && p.lng >= Math.min(p1.lng, p2.lng)) { //overlies on a horizontal ray
                        return boundOrVertex;
                    }

                    if (p1.lng == p2.lng) { //ray is vertical                        
                        if (p1.lng == p.lng) { //overlies on a vertical ray
                            return boundOrVertex;
                        } else { //before ray
                            ++intersectCount;
                        }
                    } else { //cross point on the left side                        
                        var xinters = (p.lat - p1.lat) * (p2.lng - p1.lng) / (p2.lat - p1.lat) + p1.lng; //cross point of lng                        
                        if (Math.abs(p.lng - xinters) < precision) { //overlies on a ray
                            return boundOrVertex;
                        }

                        if (p.lng < xinters) { //before ray
                            ++intersectCount;
                        }
                    }
                }
            } else { //special case when ray is crossing through the vertex                
                if (p.lat == p2.lat && p.lng <= p2.lng) { //p crossing over p2                    
                    var p3 = pts[(i + 1) % N]; //next vertex                    
                    if (p.lat >= Math.min(p1.lat, p3.lat) && p.lat <= Math.max(p1.lat, p3.lat)) { //p.lat lies between p1.lat & p3.lat
                        ++intersectCount;
                    } else {
                        intersectCount += 2;
                    }
                }
            }
            p1 = p2; //next ray left point
        }

        if (intersectCount % 2 == 0) { //偶数在多边形外
            return false;
        } else { //奇数在多边形内
            return true;
        }
    }

    /**
     * [mergePolygon 多边形合并]
     * @param  {[type]} polygon1 [第一个多边形]
     * @param  {[type]} polygon2 [第二个多边形]
     * @return {[type]}          [多边形合并结果集]
     */
    polygonCtrl.mergePolygon = function(polygon1, polygon2) {

        if (!(polygon1 instanceof BMap.Polygon) ||
            !(polygon2 instanceof BMap.Polygon)) {
            return [];
        }

        var pointArray1 = polygon1.getPath(),
            pointArray2 = polygon2.getPath();

        for (var i = pointArray1.length - 1; i >= 0; i--) {
            var pointItem = pointArray1[i];
            if (this.isPointInPolygon(pointItem, polygon2)) {
                pointItem.cancle = true;
            }
        }

        for (var i = pointArray2.length - 1; i >= 0; i--) {
            var pointItem = pointArray2[i];
            if (this.isPointInPolygon(pointItem, polygon1)) {
                pointItem.cancle = true;
            }
        }

        var point1Prev = pointArray1[0];
        var point2Prev = pointArray2[0];

        var crossPoints = [];
        for (var i = 1; i <= pointArray1.length; i++) {
            point1Next = pointArray1[i % pointArray1.length];

            for (var j = 1; j <= pointArray2.length; j++) {
                point2Next = pointArray2[j % pointArray2.length];

                // 解方程得出交叉点
                var crossPoint = mapEquationsSet([point1Prev, point1Next], [point2Prev, point2Next]);
                if (crossPoint) {
                    crossPoints.push(crossPoint);
                }
                point2Prev = point2Next;
            }

            point1Prev = point1Next；
        }

        return [];
    }

    function mapEquationsSet(points1, points2) {
        // 平行
        var k1, k2, b1, b2;
        // 水平平行
        if (points1[0].lng == points1[1].lng && points2[0].lng == points2[1].lng) {
            if (points1[0].lng == points2[0].lng) {
            	
            } else {
                return false;
            }
        }
        var k1 = (points1[0].lat - points1[1].lat) / (points1[0].lng - points1[1].lng);
        var k2 = (points2[0].lat - points2[1].lat) / (points2[0].lng - points2[1].lng);
        // 交叉
    }

})();
