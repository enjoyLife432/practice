/**
 *
 * 地图的图层较多，不同的图层切换到时候，如果每次都是重新生成那么非常消耗重绘性能，造成页面卡顿，索性页面初次加载完毕后
 * 就把一些固定的图层先生成好，不需要展示的图层暂时先隐藏，那么在切换的时候在显示出来，这样做牺牲内存换取图层切换的流畅体验
 *
 */

// import stations from "../../assets/subway_stations.json"; // 地铁站点数据
// import sptccData from "../../assets/site.json"; // 一卡通充值点数据
import sptccData from "../../assets/sptcc_jt.json"; // 一卡通充值点数据
import tourData from "../../assets/tour.json"; //旅游卡数据
// import tourData from "../../assets/travel_sights2.json"; //旅游卡数据
import etcData from "../../assets/etc_parking.json";
import AMapLoader from "@amap/amap-jsapi-loader";
import { ref, onMounted, watch, reactive, nextTick, onBeforeUnmount } from "vue";
import useSelect from "../useSelect";

import subway_geo from "../../assets/geo/subway.json"; //geo数据，地铁线路
import busline_geo from "../../assets/geo/busline.json"; //

// bus_flow
// import bus_flow_data from "../../assets/bus_flow.json"
import bus_flow_data from "../../assets/bus_flow2.json"

import metro_flow_data from "../../assets/metro_flow.json"

import axios from "@/utils/request";
const _ = require("lodash")

let map = null;

// 11-29，地图图层快速切换会导致地图错换，原因是图层绘制函数都是异步延迟2s执行的，解决方案就是控制图层函数每次只能执行一个，加控制变量
let renderFlag = false;

// 地图加载遮罩
const mapLoading = ref(true);

export default function useMap () {
  // 地图实例化
  let mapDom = ref(null);


  const init = () => {
    AMapLoader.load({
      key: "08934b1b81864e2374b6a0a5055f2a0b",
      version: "2.0",
      Loca: {
        version: "2.0.0",
      },
    }).then((AMap) => {
      map = new AMap.Map(mapDom.value, {
        // center: [121.473667, 31.232919],
        center: [121.473667, 31.132919],
        viewMode: "3D",
        pitch: 50,
        zoom: 11,
        rotateEnable: false,
        mapStyle: "amap://styles/ae2305f274f580c1b8e28d92215717fe",
      });

      map.on('complete', function () {
        mapLoading.value = false; //地图加载完毕
      })

      // 双击事件，获取地图动态信息,开发时
      map.on('rightclick', function () {
        console.log('zoomAndCenter', map.getZoom(), map.getCenter())
      })

      drawAllLines(AMap, map);

      // 控制变量
      renderFlag = true;

    });
  };


  onMounted(init); // 暂时关闭

  onBeforeUnmount(() => {
    resetMap()
  })

  /** 集中管理 定时器，markder是dom，便于清除 */
  let timerIds = [];
  let allMarkers = [];

  // 地铁线和公交线同时绘制  暂停 继续
  /**
   * 一卡通 消费
   *  地铁线 公交线
   */
  const timeDelta = ref(0);                               // 距离开始时间间隔
  const flushLinesFlag = ref(false);
  const timerId = ref(0);                                 // 定时器的id
  const setPause = ref(null), setResume = ref(null);
  const pauseTimeDelta = ref(0);                          // 暂停的时间间隔
  const showAllLinesFlag = ref(false);                    // 标记当前地铁线和公交线图层是否展示
  const drawAllLines = (AMap, map) => {
    showAllLinesFlag.value = true;
    // 2021-10-12T00:00:00 取这一天的值，bus_flow.json也是这一天算出来的时间戳
    const start_time = new Date('2021-10-12T04:00:00').getTime() / 1000           // 起始时刻 4点开始
    const end_time = new Date('2021-10-12T23:59:59').getTime() / 1000;            // 终止时刻 23:59


    const init_color = 'hsl(61, 93%, 0%)'; // 初始颜色

    // 根据时刻计算流量值
    const easeFunc = (t, lineId) => {
      // t 是2021-10-12 那一天的时间戳转秒
      // t 的取值范围 (start_time,end_time)
      //根据id过滤
      const data_array = metro_flow_data[lineId];
      if (!data_array) return 0;

      let time = t;

      // 根据time 找到它的左右相邻点, data_array 是升序排列
      let min, max;


      let result;

      if (time < data_array[0].t || time > data_array[data_array.length - 1].t) {
        // 当前时间 不在数据范围内，表明公交线没有运行
        max = min = {
          l: 0
        }

        result = 0;

      } else {
        for (let i = 0; i < data_array.length; i++) {
          const p = data_array[i];
          if (time > p.t) {
            continue;
          } else {
            max = p;
            if (i == 0 || i == data_array.length - 1) {
              // 时刻刚好落在起点或者终点
              result = p.l;
            } else {
              min = data_array[i - 1]
              result = min.l + (time - min.t) / (max.t - min.t) * (max.l - min.l)
              // console.log(lineId, result)
            }
            break;
          }
        }
      }
      return result;
    }

    // 根据时刻插值计算流量值
    const easeFunc2 = (t, lineId) => {
      // t 是2021-10-12 那一天的时间戳转秒
      // t 的取值范围 (start_time,end_time)
      //根据id过滤
      const data_array = bus_flow_data[lineId];
      if (!data_array) return 0;

      let time = t;

      // 根据time 找到它的左右相邻点, data_array 是升序排列
      let min, max;


      let result;

      if (time < data_array[0].t || time > data_array[data_array.length - 1].t) {
        // 当前时间 不在数据范围内，表明公交线没有运行
        max = min = {
          l: 0
        }

        result = 0;

      } else {
        for (let i = 0; i < data_array.length; i++) {
          const p = data_array[i];
          if (time > p.t) {
            continue;
          } else {
            max = p;
            if (i == 0 || i == data_array.length - 1) {
              // 时刻刚好落在起点或者终点
              result = p.l;
            } else {
              min = data_array[i - 1]
              result = min.l + (time - min.t) / (max.t - min.t) * (max.l - min.l)
              // console.log(lineId, result)
            }
            break;
          }
        }
      }
      return result;
    }



    // 地铁线颜色
    const calColor = (ease, lineId) => {
      // 颜色过渡 l值决定颜色，变化范围 0-50
      // const start_col = 'hsl(133, 71%, 0%)'
      // const high_col = 'hsl(133, 71%, 50%)'

      // 此刻的时间戳s, 
      // const now = new Date().getTime() / 1000; // 时间映射 2021-10-12

      // let delt = (now - today_start - pauseTimeDelta.value) % (today_end - today_start); //时间间隔 0-90s之间


      // 放大倍数
      const multiple = 600 * 2; // 20小时 相当于1分钟

      let delt = multiple * timeDelta.value / 1000; // s


      let time_map = start_time + delt; // 映射到数据当天的时刻

      // // 时间：
      // let date = new Date(time_map * 1000)
      // console.log(`时间：${date.getHours()}:${date.getMinutes()}`)

      const level = ease(time_map, lineId);

      // const l = (50 - 0) / 10 * level + 0; // level 取值范围[0,10]
      const l = .5 * level * level;
      // return `hsl(133,71%,${l}%)`;

      return `hsl(61,93%,${l}%)`;
    }

    const calColor2 = (ease, lineId) => {
      // 颜色过渡 hsl(61, .39, .39) ==> hsl(20, .39, .39)
      const start_col = 'hsl(61, 93%, 11%)'
      const high_col = 'hsl(61, 93%, 50%)'

      // // 此刻的时间戳s, 
      // const now = new Date().getTime() / 1000; // 时间映射 2021-10-12

      // let delt = (now - today_start - pauseTimeDelta.value) % (today_end - today_start); //时间间隔 0-120s之间

      // 放大倍数
      const multiple = 600 * 2;

      const delt = multiple * timeDelta.value / 1000; // 转为s


      let time_map = start_time + delt; // 映射到数据当天的时刻

      // // 时间：
      // let date = new Date(time_map * 1000)
      // console.log(`时间：${date.getHours()}:${date.getMinutes()}`)

      const level = ease(time_map, lineId);

      // const l = (50 - 0) / 10 * level + 0; // level 取值范围[0,10]
      const l = .5 * level * level;

      return `hsl(61,93%,${l}%)`;
    }

    // 地铁线
    const polylines_subway = []
    subway_geo.features.forEach(item => {

      const points_array = item.geometry.coordinates;

      const lineId = item.properties.type;

      const path = [];

      points_array.forEach(point => {
        path.push(new AMap.LngLat(point[0], point[1]))
      })

      // 创建折线实例
      const polyline = new AMap.Polyline({
        path: path,
        strokeWeight: 3, // 线条宽度，默认为 1
        strokeColor: init_color, // 线条颜色
        extData: lineId,
        zIndex: 99,
      });

      map.add(polyline)

      polylines_subway.push(polyline)

    })

    // 公交线
    const polylines_bus = []
    busline_geo.features.forEach(item => {

      const points_array = item.geometry.coordinates;

      const lineId = item.properties.type;

      const path = [];

      points_array.forEach(point => {
        path.push(new AMap.LngLat(point[0], point[1]))
      })

      // 创建折线实例
      const polyline = new AMap.Polyline({
        path: path,
        strokeWeight: 2, // 线条宽度，默认为 1
        strokeColor: init_color, // 线条颜色
        extData: lineId
      });

      map.add(polyline)

      polylines_bus.push(polyline)

    })


    // 计算当下时间的间隔
    // 今天的时间戳
    const today_start = new Date().getTime();
    const today_end = today_start + 60 * 1000; // 1分钟
    const calcTimeDelta = () => {
      // 此刻的时间戳，计算时间间隔
      const now = new Date().getTime(); // 此刻的时间戳

      let delt = (now - today_start - pauseTimeDelta.value) % (today_end - today_start);

      // timeDelta 取500ms的整数倍，因为定时器500ms跑一次
      delt = delt - delt % 500

      // console.log('delt', delt)
      timeDelta.value = delt;
    }

    // 
    const change = () => {
      // window.requestAnimationFrame(change);

      calcTimeDelta();

      polylines_subway.forEach((polyline) => {
        let lineId = polyline.getOptions().extData
        polyline.setOptions({
          strokeColor: calColor(easeFunc, lineId)
        })
      })

      polylines_bus.forEach((polyline) => {
        let lineId = polyline.getOptions().extData
        polyline.setOptions({
          strokeColor: calColor2(easeFunc2, lineId)
        })
      })
    }

    flushLinesFlag.value = true;
    timerId.value = setInterval(change, 500) // 

    // 暂停
    let pause_time = 0;

    setPause.value = () => {
      // 标记暂停时刻
      pause_time = new Date().getTime();
      clearInterval(timerId.value)
      flushLinesFlag.value = false;
    }
    // 继续
    setResume.value = (delta) => {
      // 暂停的时间间隔 要取 500ms的倍数，定时器时500ms跑一次
      let pauseDelta = new Date().getTime() - pause_time;

      pauseTimeDelta.value += pauseDelta  // 暂停的时间间隔要累加起来，可能多次暂停 ms

      console.log('暂停间隔', pauseTimeDelta.value)

      change();
      timerId.value = setInterval(change, 500);
      flushLinesFlag.value = true;
    }


  }




  // 一卡通 充值  点的聚合
  let sptcc_cluster_layer = null;
  const drawSptccLayer = (AMap, map) => {
    const points = [];
    sptccData.forEach((site) => {
      points.push({
        lnglat: [site.longtitude, site.latitude],
      });
    });

    // 上海区县图
    drawSHLayer(AMap, map)

    // 聚合点
    AMap.plugin(["AMap.MarkerCluster"], function () {
      sptcc_cluster_layer = new AMap.MarkerCluster(map, points, {
        gridSize: 100, // 聚合网格像素大小,可以调整疏密
        styles: [
          {
            url: require('../../assets/imgs/c-blue.png'),
            size: new AMap.Size(32, 32),
            offset: new AMap.Pixel(-16, -16),
            textColor: "#fff",
          },
          {
            url: require('../../assets/imgs/c-green.png'),
            size: new AMap.Size(32, 32),
            offset: new AMap.Pixel(-16, -16),
            textColor: "#fff",
          },
          {
            url: require('../../assets/imgs/c-green2.png'),
            size: new AMap.Size(36, 36),
            offset: new AMap.Pixel(-18, -18),
            textColor: "#fff",
          },
          {
            url: require('../../assets/imgs/c-yellow.png'),
            size: new AMap.Size(48, 48),
            offset: new AMap.Pixel(-24, -24),
            textColor: "#fff",
          },
        ],
      })

      // 图层清除方法，本身实现是基于dom的方式
      sptcc_cluster_layer.remove = () => {
        sptcc_cluster_layer.setMap(null);
        sptcc_cluster_layer = null;
      }
    });
  };




  // ETC 停车场： scatterpointer ,infowindow
  /**
   * scatterpointer 颜色根据数值区分 蓝色 黄色， 红色
   * 点击出现信息窗体，展示数据
   */
  // ETC 停车场
  const etc_park_data = ref([]);
  const getAllEtcPark = () => {
    if (etc_park_data.value.length > 0) {
      return Promise.resolve(etc_park_data)
    } else {
      return axios({
        method: "post",
        url: "/social/getEtcExpense",
        data: {
          type: "0",
          placeNo: "",
        },
      }).then((res) => {
        etc_park_data.value = [...res];
        return etc_park_data;
      });
    }
  };
  const drawETCPoints = (AMap, map) => {

    const icons_blue = []
    for (let i = 0; i < 23; i++) {
      // 创建一个 Icon
      const startIcon = new AMap.Icon({
        // 图标尺寸
        size: new AMap.Size(30, 27),
        // 图标的取图地址
        image: require('../../assets/imgs/scatter-blue.png'),
        // 图标所用图片大小
        imageSize: new AMap.Size(686, 27), // 图片的总长 * 总宽， 23个子图
        // 图标取图偏移量
        imageOffset: new AMap.Pixel(-30 * i, 0) // 单张图 60 * 54
      });
      icons_blue.push(startIcon)
    }

    const icons_blue_zero = new AMap.Icon({
      // 图标尺寸
      size: new AMap.Size(30, 27),
      // 图标的取图地址
      image: require('../../assets/imgs/icon_blue_scatter.png'),
      // 图标所用图片大小
      imageSize: new AMap.Size(30, 27), // 图片的总长 * 总宽， 23个子图
      // 图标取图偏移量
      imageOffset: new AMap.Pixel(0, 0) // 单张图 60 * 54
    });

    const icons_yellow = []
    for (let i = 0; i < 23; i++) {
      // 创建一个 Icon
      const startIcon = new AMap.Icon({
        // 图标尺寸
        size: new AMap.Size(30, 27),
        // 图标的取图地址
        image: require('../../assets/imgs/scatter-yellow.png'),
        // 图标所用图片大小
        imageSize: new AMap.Size(686, 27), // 图片的总长 * 总宽， 23个子图
        // 图标取图偏移量
        imageOffset: new AMap.Pixel(-30 * i, 0) // 单张图 60 * 54
      });
      icons_yellow.push(startIcon)
    }

    const icons_red = []
    for (let i = 0; i < 23; i++) {
      // 创建一个 Icon
      const startIcon = new AMap.Icon({
        // 图标尺寸
        size: new AMap.Size(30, 27),
        // 图标的取图地址
        image: require('../../assets/imgs/scatter-red.png'),
        // 图标所用图片大小
        imageSize: new AMap.Size(686, 27), // 图片的总长 * 总宽， 23个子图
        // 图标取图偏移量
        imageOffset: new AMap.Pixel(-30 * i, 0) // 单张图 60 * 54
      });
      icons_red.push(startIcon)
    }


    const markers_blue = [];
    const markers_yellow = [];
    const markers_red = [];
    const iconType = (amount,no11ConsumerAmount) => {
      if (amount == 0) return [icons_blue_zero];
      // return amount < 30000 ? icons_blue : amount < 60000 ? icons_yellow : icons_red;
      // return icons_yellow;//20221127 所有有交易的用黄色 彭春露 
      return amount > no11ConsumerAmount ? icons_red : icons_yellow;//20221130 top30的数据改成红色 
    }

    getAllEtcPark().then(res => {
      let consumerAmountArr = [];
      res.value.forEach((e)=>{
        consumerAmountArr.push(e.consumerAmount);
      })
      let sortArr = consumerAmountArr.sort((a,b)=>(b-a));
      console.log('sortArr===',sortArr)
      let no11ConsumerAmount = sortArr[30];//top30的数据，取第31个数据做判断
      console.log('no11ConsumerAmount===',no11ConsumerAmount)

      // 创建marker点
      etcData.forEach(p => {

        // 从res.value中查找是否有数据，res.value是有数据的点的数组
        // {
        //   "monthName": "202109",
        //   "libNo": "3101050001",
        //   "libName": "尚嘉中心停车场",
        //   "consumerNum": 4000,
        //   "consumerAmount": 90000
        // },
        const item = res.value.find(v => v.libNo == p.id);
        const consumerNum = item ? item.consumerNum : 0;
        const consumerAmount = item ? item.consumerAmount : 0;

        // const icon = iconType(consumerAmount);
        const icon = iconType(consumerAmount,no11ConsumerAmount);


        // 将 icon 传入 marker
        var marker = new AMap.Marker({
          position: new AMap.LngLat(p.lng, p.lat),
          icon: icon[0],
          extData: {
            ...p,
            consumerNum,
            consumerAmount,
          },
          zIndex: consumerAmount > 60000 ? 3 : consumerAmount > 30000 ? 2 : 1
        });

        // marker 添加到对应的数组中
        icon === icons_blue ? markers_blue.push(marker) :
          icon === icons_yellow ? markers_yellow.push(marker) : (icon === icons_red ? markers_red.push(marker) : markers_blue.push(marker));


        // 将 marker 添加到地图
        map.add(marker);

        // 点击事件，信息弹窗
        marker.on('click', function (ev) {
          // console.log('marker.click', this.getExtData())
          const markerData = this.getExtData();


          // 信息窗体的内容
          var innerHtml = `
            <div class="etc-park">
              <div class="left"></div>
              <div class="mid">
                <div class="item"> 当前区域：<span class="title">${markerData.name}<span/> </div>
                <div class="item"> 月消费笔数：
                  <span class="value">${markerData.consumerNum == 0 ? '-' : markerData.consumerNum}</span> 
                  <span class="unit">${markerData.consumerNum == 0 ? '' : '笔'}</span> 
                </div>
                <div class="item"> 月消费金额：
                  <span class="value">${markerData.consumerAmount == 0 ? '-' : markerData.consumerAmount}</span> 
                  <span class="unit">${markerData.consumerAmount == 0 ? '' : '元'}</span>  
                </div>
              </div>
              <div class="right">
    
              </div>
            </div>
          `

          // 创建 infoWindow 实例	
          var infoWindow = new AMap.InfoWindow({
            closeWhenClickMap: true,
            anchor: 'bottom-left',
            offset: new AMap.Pixel(12, 90),  // 手动调整，保证盒子左下角居于marker的中心点
            content: innerHtml   //传入 dom 对象，或者 html 字符串
          });



          //打开信息窗体
          infoWindow.open(map, [markerData.lng, markerData.lat]);
        })

      })

      //定时器跑起来，展示涟漪效果
      let idx = 0; // 
      const scatter = () => {
        idx++;
        // window.requestAnimationFrame(scatter);
        markers_blue.forEach(marker => {
          // 蓝色过滤
          if (marker.getExtData().consumerAmount > 0) {
            marker.setIcon(icons_blue[idx % 23])
          }
        })
        markers_yellow.forEach(marker => {
          marker.setIcon(icons_yellow[idx % 23])
        })
        markers_red.forEach(marker => {
          marker.setIcon(icons_red[idx % 23])
        })

      }

      let id = setInterval(scatter, 200)
      timerIds.push(id);

    })
  }





  // 旅游卡 长三角 上海city pass 红色之旅
  /**
   * 上三角 显示市行政图，marker点，加上label，label显示城市名称
   * 上海，显示行政区范围图，鼠标滑过高亮，默认显示marker ,点击显示信息窗口，
   */
  let yangtze_layer = null;
  const drawTourYangtze = (AMap, map) => {
    // const posData = tourData.filter(v => v.product_type == '长三角PASS');
    const posData = tourData['长三角PASS'];

    // 长三角数据点
    const icons_green = [];
    const markers_green = [];

    // 长三角区域曲线图
    AMap.plugin("AMap.DistrictLayer", function () {
      //异步加载插件
      yangtze_layer = new AMap.DistrictLayer.Province({
        zIndex: 12,
        adcode: posData.map((v) => v.adcode),
        depth: 1,
        styles: {
          fill: "rgba(78, 156, 233, 0.27)",
          "city-stroke": "rgba(2, 228, 254, 0.5)",
          "stroke-width": 2,
        },
      });
      map.add(yangtze_layer);

      yangtze_layer.remove = () => {
        yangtze_layer.setMap(null);
        markers_green.forEach(marker => {
          marker.setMap(null);
          marker = null;
        })
        yangtze_layer = null;
      }
    });

    // 城市中心点marker =>  通过定时刷新marker的icon图标达到动画效果

    for (let i = 0; i < 23; i++) {
      // 创建一个 Icon
      const startIcon = new AMap.Icon({
        // 图标尺寸
        size: new AMap.Size(30, 27),
        // 图标的取图地址
        image: require('../../assets/imgs/scatter-green.png'),
        // 图标所用图片大小
        imageSize: new AMap.Size(686, 27), // 图片的总长 * 总宽， 23个子图
        // 图标取图偏移量
        imageOffset: new AMap.Pixel(-30 * i, 0) // 单张图 30 * 27
      });
      icons_green.push(startIcon)
    }

    posData.forEach(p => {
      //绘制marker
      const marker = new AMap.Marker({
        position: new AMap.LngLat(p.longitude, p.latitude),
        icon: icons_green[5],
      });

      // 设置label标签
      marker.setLabel({
        direction: 'right',
        offset: new AMap.Pixel(-15, -45),  //设置文本标注偏移量，要手动调整
        content: `<div class='marker-info yangtze'>${p.city_name}</div>`, //设置文本标注内容
      });

      markers_green.push(marker);
      map.add(marker);

    });

    //定时器跑起来，展示涟漪效果, 卡顿，影响地图流畅度,暂时先关闭
    // let idx = 0;
    // const scatter = () => {
    //   idx++;
    //   markers_green.forEach(marker => {
    //     marker.setIcon(icons_green[idx % 23])
    //   })
    // }
    // setInterval(scatter, 100)

  }



  // 上海city pass
  let tourSH_layer = null;
  const drawTourShangHai = (AMap, map) => {
    tourSH_layer = {};//
    // drawSHLayer(AMap, map);
    // 城市中心点marker =>  通过定时刷新marker的icon图标达到动画效果
    // 长三角数据点
    // const posData = tourData.filter(v => v.product_type == '上海City Pass');
    const posData = tourData['上海City Pass'];
    const icons_blue = [];
    const markers_blue = [];
    for (let i = 0; i < 23; i++) {
      // 创建一个 Icon
      const startIcon = new AMap.Icon({
        // 图标尺寸
        size: new AMap.Size(60, 54),
        // 图标的取图地址
        image: require('../../assets/imgs/scatter-blue.png'),
        // 图标所用图片大小
        imageSize: new AMap.Size(1372, 54), // 图片的总长 * 总宽， 23个子图
        // 图标取图偏移量
        imageOffset: new AMap.Pixel(-60 * i, 0) // 单张图 30 * 27
      });
      icons_blue.push(startIcon)
    }

    posData.forEach(p => {
      //绘制marker
      console.log(p)
      const marker = new AMap.Marker({
        position: new AMap.LngLat(p.longitude, p.latitude),
        icon: icons_blue[0],
        extData: {
          ...p
        }
      });
      // 点击事件，信息弹窗
      marker.on('click', function (ev) {
        const markerData = this.getExtData();
        // 信息窗体的内容
        var innerHtml = `
          <div class="tour-sh">
            <div class="left"></div>
            <div class="mid">
              <span>${markerData.memo}</span>
            </div>
            <div class="right">
              <div class="close"></div>
            </div>
          </div>
        `

        // 创建 infoWindow 实例	
        const infoWindow = new AMap.InfoWindow({
          closeWhenClickMap: true, // 鼠标点击空白地图关闭窗体
          anchor: 'bottom-left',
          offset: new AMap.Pixel(25, 30),  // 手动调整，保证盒子左下角居于marker的中心点
          content: innerHtml   //传入 dom 对象，或者 html 字符串
        });
        //打开信息窗体
        infoWindow.open(map, [markerData.longitude, markerData.latitude]);
      })

      markers_blue.push(marker);
      map.add(marker);

    });

    //定时器跑起来，展示涟漪效果
    let idx = 0;
    const scatter = () => {
      idx++;
      markers_blue.forEach(marker => {
        marker.setIcon(icons_blue[idx % 23])
      })
    }
    let id = setInterval(scatter, 100)
    timerIds.push(id);

    // 图层清除方法，涉及到marker得清除
    tourSH_layer.remove = () => {
      markers_blue.forEach(marker => {
        marker.setMap(null);
        marker = null;
      })
      tourSH_layer = null;
    }
  }


  // 上海 - 红色之旅
  let shevo_layer = null;
  const drawShEvo = (AMap, map) => {
    shevo_layer = {};
    // const posData = tourData.filter(v => v.product_type == '红色之旅');
    const posData = tourData['红色之旅'];
    const icons_red = [];
    const markers_red = [];
    for (let i = 0; i < 23; i++) {
      // 创建一个 Icon
      const startIcon = new AMap.Icon({
        // 图标尺寸
        size: new AMap.Size(42, 38), // 60, 54 缩放0.7
        // 图标的取图地址
        image: require('../../assets/imgs/scatter-red.png'),
        // 图标所用图片大小
        imageSize: new AMap.Size(960, 38), // 图片的总长 * 总宽， 23个子图
        // 图标取图偏移量
        imageOffset: new AMap.Pixel(-42 * i, 0) // 单张图 30 * 27
      });
      icons_red.push(startIcon)
    }

    posData.forEach(p => {
      //绘制marker
      const marker = new AMap.Marker({
        position: new AMap.LngLat(p.longitude, p.latitude),
        icon: icons_red[0],
      });

      // 设置label标签
      marker.setLabel({
        direction: 'right',
        offset: new AMap.Pixel(-25, -45),  //设置文本标注偏移量，要手动调整
        content: `<div class='marker-info evo'>
                    <div class="left"></div>
                    <div class="mid"><span>${p.memo}</span></div>
                    <div class="right"></div>
                </div>`, //设置文本标注内容
      });

      markers_red.push(marker);
      map.add(marker);

    });

    // 图层清除方法，涉及到marker得清除
    shevo_layer.remove = () => {
      markers_red.forEach(marker => {
        marker.setMap(null);
        marker = null;
      })
      shevo_layer = null;
    }

    //定时器跑起来，展示涟漪效果,影响性能
    // let idx = 0;
    // const scatter = () => {
    //   idx++;
    //   markers_red.forEach(marker => {
    //     marker.setIcon(icons_red[idx % 23])
    //   })
    // }
    // setInterval(scatter, 100)
  }




  // 上海 - 区县行政图
  const drawSHLayer = (AMap, map) => {
    const areas = ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区']
    AMap.plugin('AMap.DistrictSearch', function () {
      // 创建行政区查询对象
      var district = new AMap.DistrictSearch({
        // 返回行政区边界坐标等具体信息
        extensions: 'all',
        // 设置查询行政区级别为 区 
        level: 'district'
      })
      areas.forEach(area => {
        district.search(area, function (status, result) {
          // console.log('result', result)

          // 获取的边界信息
          let bounds = result.districtList[0].boundaries;
          let center = result.districtList[0].center;

          if (area == '宝山区') {
            bounds = result.districtList[2].boundaries
            center = result.districtList[2].center;
          }

          let polygons = [];
          if (bounds) {
            for (var i = 0, l = bounds.length; i < l; i++) {
              //生成行政区划polygon
              var polygon = new AMap.Polygon({
                map: map,
                strokeWeight: 1,
                path: bounds[i],
                fillOpacity: 0.7,
                fillColor: 'transparent',
                strokeColor: 'rgba(2,228,254,.5)',
                cursor: "pointer"
              })
              polygons.push(polygon)
            }

            // 注册事件，鼠标滑过高亮，同时显示该地区的区名称
            // 创建标签

            var text = new AMap.Text({
              position: center,
              anchor: 'top-right',
              text: area,
              style: { 'background-color': 'transparent', color: '#fff', border: 'none' },
            });
            map.add(text);
            text.hide();

            polygons.forEach(polygon => {

              polygon.on('mouseover', function (ev) {
                // console.log('mouseover')
                polygons.forEach(polygon => {
                  polygon.setOptions({
                    fillColor: "rgb(78,156,233)",
                    fillOpacity: .3
                  })
                })
                text.show()
              })

              polygon.on('mouseout', function (ev) {
                // console.log('mouseout')
                polygons.forEach(polygon => {
                  polygon.setOptions({
                    fillColor: "transparent"
                  })
                })
                text.hide()
              });


            })
          }
        })
      })
    })
  }
  const cdrawSHLayer = (AMap, map) => {
    if (!renderFlag) return;
    renderFlag = false;
    drawSHLayer(AMap, map);
    renderFlag = true;
  }



  // 图层 绘制ETC 充值点数据
  const getEtcExpense = (code) => {
    return axios({
      method: "post",
      url: "/social/getEtcExpense",
      data: {
        type: 0, // 1 收费站， 0停车场
        placeNo: code,
      },
    });
  };



  /**
   *  根据左侧 地图 菜单 选择，处理图层切换
   */

  const index = ref('1-1'); // 默认选中的图层编码1-1，具体参看 menu组件，data定义
  const resetMap = () => {
    // 每次切换地图图层之前，要清除当前图层信息，包括信息窗体，动画定时器等等
    map.clearMap();
    map.clearInfoWindow();
    clearInterval(timerId.value);
    timerIds.forEach(id => clearInterval(id));

    // 聚合点图层清除
    sptcc_cluster_layer && sptcc_cluster_layer.remove()

    // 旅游卡-长三角
    yangtze_layer && yangtze_layer.remove()

    // 旅游卡-上海
    tourSH_layer && tourSH_layer.remove()

    // 旅游卡 - 红色之旅
    shevo_layer && shevo_layer.remove()

    // 公交线-地铁线标记
    showAllLinesFlag.value = false;

    // 上海区县图层
    // sh_layer && sh_layer.remove()
  }


  let handleChange = idx => {
    // 控制函数的执行
    if (!renderFlag) return;
    renderFlag = false;

    if (index.value == idx) return;
    index.value = idx;

    // 切换地图图层
    if (index.value == '1-1') {
      // 一卡通- 消费 - 公交线地铁线
      resetMap();
      map.setZoomAndCenter(11, [121.520675, 31.164019], false, 2000); // 重新调整地图的放大等级和中心点
      // 绘制地铁线 公交线
      setTimeout(() => {
        drawAllLines(AMap, map);
        renderFlag = true;
      }, 2000)

    }

    if (index.value == '1-2') {
      // -卡通 充值 点聚合
      resetMap()
      map.setZoomAndCenter(10.5, [121.477906, 31.140011], false, 2000); // 重新调整地图的放大等级和中心点
      setTimeout(() => {
        drawSptccLayer(AMap, map)
        renderFlag = true;
      }, 2000)
    }

    if (index.value == '2') {
      // etc 停车点
      resetMap();
      map.setZoomAndCenter(11.8, [121.448348, 31.158904], false, 2000); // 重新调整地图的放大等级和中心点
      setTimeout(() => {
        drawETCPoints(AMap, map)
        renderFlag = true;
      }, 2000)
    }

    if (index.value == '3-1') {
      // 旅游卡 - 长三角
      resetMap()
      // 调整地图的缩放和中心点
      map.setZoomAndCenter(8.19, [120.380309, 31.713616], false, 2000); // 重新调整地图的放大等级和中心点

      setTimeout(() => {
        drawTourYangtze(AMap, map)
        renderFlag = true;
      }, 2000)

    }

    if (index.value == '3-2') {
      // 旅游卡 - 上海city
      resetMap();
      map.setZoomAndCenter(12.74, [121.483924, 31.223205], false, 2000)

      setTimeout(() => {
        drawSHLayer(AMap, map)
        drawTourShangHai(AMap, map)
        renderFlag = true;
      }, 2000)

    }

    if (index.value == '3-3') {
      resetMap();
      // 红色之旅
      map.setZoomAndCenter(13.5, [121.479389, 31.21868], false, 2000)
      setTimeout(() => {
        drawSHLayer(AMap, map)
        drawShEvo(AMap, map)
        renderFlag = true;
      }, 2000)
    }
  }



  return {
    index,
    handleChange,
    mapDom,
    mapLoading,
    timeDelta,
    flushLinesFlag,
    showAllLinesFlag,
    setPause,
    setResume
  };
}
