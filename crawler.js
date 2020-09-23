// ==UserScript==
// @name         懂车帝车型数据爬虫
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  懂车帝车型数据爬虫
// @author       Abbotton
// @match        https://mibrsoft.com
// @grant        none
// @include      https://www.dcdapp.com/auto
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/1.12.4/jquery.min.js
// @iconURL      https://s3.pstatp.com/motor/fe/m_web/image/icon_b20643c1e72d93179f6ff6e3e33e2ab0.png
// @run-at       document-end
// ==/UserScript==

$(document).ready(function () {
    $.ajaxSettings.async = false;

    var carBrands = [];
    var cars = [];
    var carSeries = [];

    var download = function (content, fileName) {
        var element = document.createElement('a');
        element.download = fileName;
        element.style.display = 'none';
        element.href = URL.createObjectURL(new Blob([JSON.stringify(content)]));
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    var getCars = function (id) {
        var url = 'https://www.dcdapp.com/motor/car_page/m/v1/series_all_json/?series_id=' + id + '&city_name=%E5%A4%AA%E5%8E%9F&show_city_price=1&m_station_dealer_price_v=1';
        $.get(url, function (data) {
            var array = data.data.offline.concat(data.data.online);
            $(array).each((i, v) => {
                if (v.type == '1037') {
                    cars.push({
                        series_id: v.info.series_id,
                        name: v.info.name
                    });
                }
            });
        });
    };

    var getCarSeries = function () {
        $('#go').text('正在采集车系和车型......');
        var page = 0;
        var flag = true;
        var loading = false;
        while (flag) {
            if (loading) {
                return;
            }
            console.log('正在采集第' + (page + 1) + '页数据');
            loading = true;
            var randomOne = Math.floor(Math.random() * (10 - 1) + 1);
            setTimeout(function () {
                $.post(
                    'https://www.dcdapp.com/motor/brand/m/v1/select/series/?city_name=%E5%A4%AA%E5%8E%9',
                    { limit: 200, is_refresh: 1, city_name: '%E5%A4%AA%E5%8E%9', offset: page },
                    function (data) {
                        if (data.data.series.length == 0) {
                            flag = false;
                            download(carBrands, 'car_brands.json');
                            download(carSeries, 'car_series.json');
                            download(cars, 'cars.json');
                        } else {
                            $(data.data.series).each((i, v) => {
                                carSeries.push({
                                    id: v.id,
                                    brand_id: v.brand_id,
                                    car_ids: v.car_ids,
                                    cover_url: v.cover_url
                                });
                                var randomTwo = Math.floor(Math.random() * (10 - 1) + 1);
                                setTimeout(function () {
                                    getCars(v.id);
                                }, randomTwo * 1000);
                            });
                        }
                        page++;
                        loading = false;
                    }
                );
            }, randomOne * 1000);
        }
        $('#go').text('采集完毕');
    };

    var getCarBrands = function () {
        $('#go').text('正在采集品牌......');

        $('.brands p').each((i, v) => {
            var brandId = $(v).attr('class').match(/brand\-(\d+)/)[1];
            carBrands.push({
                id: brandId,
                name: $(v).find('span').text(),
                image: $(v).find('img').attr('src')
            });
        });
        getCarSeries();
    };

    $('body').append('<button id="go" style="position: absolute;bottom: 20px;background: #ffe100;border: none;padding: 20px 40px;font-size: 18px;font-weight: bold;right: 20px;">开始采集</button>');

    $('#go').on('click', function () {
        getCarBrands();
    });
});