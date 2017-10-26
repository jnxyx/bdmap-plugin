(function($) {
    $.fn.myLocation = function(args) {
        if (this.length == 0) {
            return;
        }
        var option = {
            point: {
                prolng: 1,
                prolat: 1
            },
            displayPoint: true,
            isSetLocation: false,
            radius: 1000,
            serviceable: true,
            enableScroll: false,
            isDisableDragging: false
        };
        var options = $.extend(option, args);
        var local;
        var map;
        var mPoint;
        var keySearchEn = "subway";
        var obj = this;
        var width = obj.width() > 0 ? obj.width() : 1000;
        var height = obj.height() > 0 ? obj.height() : 433;
        //查询完毕的回调函数
        var searchComplete = function(results) {
            if (local.getStatus() != BMAP_STATUS_SUCCESS) {
                return;
            }
            for (var cnt = 0; cnt < results.getCurrentNumPois(); cnt++) {
                var point = results.getPoi(cnt);
                addMarker(results, point, cnt);
            }
        }
        initMap();
        if (options.serviceable) {
            obj.css({ 'position': 'relative' });
            initComb();
            initCombEvent();
            // searchnearby("地铁");
        }

        function initComb() {
            var str = '<div class="build-map-fc">';
            str += '<div class="build-map-ico">';
            str += '<span class="span1" serviceid="subway"></span>';
            str += '<span class="span2" serviceid="bus"></span>';
            str += '<span class="span3" serviceid="hotel"></span>';
            str += '<span class="span4" serviceid="parking"></span>';
            str += '<span class="span5" serviceid="bank"></span>';
            str += '<span class="span6" serviceid="shopping"></span>';
            str += '<span class="span7" serviceid="restaurant"></span>';
            str += '<span class="span8" serviceid="gym"></span>';
            str += '</div>';
            str += '</div>';
            obj.append(str);
        }

        function initMap() {
            obj.append('<div id="allmap" class="build-map" style="width:' + width + 'px; height:' + height + 'px"></div>');
            map = new BMap.Map("allmap"); // 创建Map实例
            mPoint = new BMap.Point(options.point.prolng, options.point.prolat);
            if (option.enableScroll) {
                map.enableScrollWheelZoom();
            }
            if (!option.isSetLocation) {
                map.disableDragging();
            }
            if (option.isDisableDragging) {
                map.enableDragging()
            }
            map.centerAndZoom(mPoint, 15);
            var opts = {
                anchor: BMAP_ANCHOR_TOP_RIGHT,
                offset: new BMap.Size(0, 10)
            };
            map.addControl(new BMap.NavigationControl(opts)); //添加鱼骨控件
            if (options.serviceable) {
                local = new BMap.LocalSearch(map, {
                    renderOptions: {
                        map: map,
                        autoViewport: false,
                    },
                    onMarkersSet: function(r) {
                        $.each(r, function(e, n) {
                            map.removeOverlay(n.marker)
                        });
                    },
                    onSearchComplete: searchComplete
                });
            }
            if (options.radius > 0) {
                var circle = new BMap.Circle(mPoint, options.radius, {
                    fillColor: "#3484ff",
                    strokeWeight: 1,
                    fillOpacity: 0.1,
                    strokeOpacity: 0.1
                });
                map.addOverlay(circle);
            }
            if (option.displayPoint) {
                renderPoint(map, mPoint);
            }
            if (options.isSetLocation) {
                map.addEventListener("click", function(e) {
                    var location = {
                        lng: e.point.lng,
                        lat: e.point.lat
                    };
                    var mlocation = new BMap.Point(e.point.lng, e.point.lat);
                    obj.data("location", location);
                    map.clearOverlays();
                    renderPoint(map, mlocation);
                });
            }
        }
        //查询完毕添加自定义标注
        function addMarker(results, point, index) {
            var host = location.host;
            var baseUrl = "http://" + host + "/Public/img/map/";
            var chKeyWord = new BMap.Icon(baseUrl + keySearchEn + '.png', //图片地址
                new BMap.Size(40, 64), // 标注显示大小
                {
                    offset: new BMap.Size(0, 0), // 标注底部小尖尖的偏移量
                    imageOffset: new BMap.Size(0, 0) // 这里相当于CSS sprites
                });
            var myIcon = chKeyWord;
            var marker = new BMap.Marker(point.point, { icon: myIcon });
            var trTitle = point.title;
            var trAddress = '<p>地址：' + point.address + '</p>';
            if (keySearchEn == 'subway') {
                trTitle += '-地铁站';
                trAddress = '<p>车次：' + point.address + '</p>';
            }
            if (keySearchEn == 'bus') {
                trTitle += '-公交车站';
                trAddress = '<p>车次：' + point.address + '</p>';
            }
            var contents = '<div class="infoWindowStyle">';
            var title = '<p  title="' + point.title + '" >' + trTitle;
            var detailUrl = '<a href="' + point.detailUrl + '" target="_blank">详情>></a></p>';
            var address = trAddress;
            var phoneNumber = '<p>电话：' + point.phoneNumber + '</p>';
            title = title + detailUrl;
            contents += address;
            if (point.phoneNumber) {
                contents += phoneNumber;
            }
            contents += "</div>"
            var opts = {
                title:title,
                setWidth: 230,
                setHeight: 59
            }
            var infoWindow = new BMap.InfoWindow(contents, opts);
            marker.addEventListener("click", function() {
                marker.openInfoWindow(infoWindow);
            });
            map.addOverlay(marker);
        }

        function initCombEvent() {
            var services = obj.find(".build-map-ico").find("span");
            searchnearby("地铁");
            services.eq(0).addClass('current');
            services.click(function() {
                map.clearOverlays();
                if (options.radius > 0) {
                    var circle = new BMap.Circle(mPoint, options.radius, {
                        fillColor: "#3484ff",
                        strokeWeight: 1,
                        fillOpacity: 0.1,
                        strokeOpacity: 0.1
                    });
                    map.addOverlay(circle);
                }
                renderPoint(map, mPoint);
                var servicename = $(this).attr("serviceid");
                keySearchEn = servicename;
                services.removeClass('current');
                $(this).addClass('current');
                switch (servicename) {
                    case "subway":
                        searchnearby("地铁");
                        break;
                    case "bus":
                        searchnearby("公交");
                        break;
                    case "hotel":
                        searchnearby("酒店");
                        break;
                    case "parking":
                        searchnearby("停车场");
                        break;
                    case "bank":
                        searchnearby("银行");
                        break;
                    case "shopping":
                        searchnearby("购物");
                        break;
                    case "restaurant":
                        searchnearby("餐饮");
                        break;
                    case "gym":
                        searchnearby("健身房");
                        break;
                }
            });
        }

        function searchnearby(service) {
            local.searchNearby(service, mPoint, options.radius);
        }

        function renderPoint(map, mPoint) {
            var pointHtml = '<div class="point"><div class="loc-point"></div></div>';
            var marker = new BMap.Label(pointHtml, { position: mPoint, offset: new BMap.Size(-22, -30) });
            map.addOverlay(marker);
        }

        return {
            getService: function(service) {
                searchnearby(service);
                local.clearResults();
            }
        }
    };
})(jQuery);
