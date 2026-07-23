WITH rows(source_url, source_title, payload) AS (
  VALUES
  (
    'https://www.xiaohongshu.com/search_result/6a606b610000000022019ca7?xsec_token=ABfAdH05DTMb8ejP2lvat4YKDrG8mXeaz-CyPC9oLBFaU=&xsec_source=',
    '来赴一场夏日限定的音乐小集！',
    $json${
      "title": "郎园Station 夏日限定音乐小集",
      "description": "小红书线索显示郎园Station有夏日音乐小集，适合周末听歌、逛园区。具体阵容、时间和票务需发布前核验。",
      "category": "music",
      "date": "2026-07-25",
      "time": "18:00",
      "address": "北京市朝阳区半截塔路53号郎园Station",
      "latitude": 39.9482,
      "longitude": 116.5478,
      "district": "朝阳区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "郎园Station",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "音乐", "郎园Station", "周末"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a5f7d67000000001c00d311?xsec_token=ABQ25AusaiGcRSK-W7svBwhbhzklCr9wf3DVCI3hVwb-0=&xsec_source=',
    '7.25-26📍免费落日音乐会，免费冲！',
    $json${
      "title": "北京客厅落日音乐会",
      "description": "小红书线索显示7月25日至26日有免费落日音乐会。建议核验具体演出时间、地点和入场规则。",
      "category": "music",
      "date": "2026-07-25",
      "time": "18:30",
      "address": "北京市朝阳区北京朝阳站交通枢纽周边北京客厅",
      "latitude": 39.9466,
      "longitude": 116.5238,
      "district": "朝阳区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "北京客厅落日音乐会",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "音乐会", "免费", "落日"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a5e3dcf000000000f032d73?xsec_token=AB8F3qJPQLDbQnSFHDtyzJzlT0_h2zHbrGr9Hhzbaocts=&xsec_source=',
    '7.26（周日）北京亮马河畔免费霞湾音乐会',
    $json${
      "title": "亮马河畔免费霞湾音乐会",
      "description": "小红书线索显示7月26日亮马河畔有免费音乐会。具体集合点、时段和天气安排需核验。",
      "category": "music",
      "date": "2026-07-26",
      "time": "18:30",
      "address": "北京市朝阳区亮马河国际风情水岸",
      "latitude": 39.9504,
      "longitude": 116.4686,
      "district": "朝阳区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "亮马河音乐活动",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "亮马河", "音乐", "免费"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a5f500a0000000011010b97?xsec_token=ABQ25AusaiGcRSK-W7svBwhasmF9WyhhvatE0aBM_bSu8=&xsec_source=',
    '7.24/25海淀卫星厂树夏音乐会🥳两天免费！',
    $json${
      "title": "海淀卫星厂树夏音乐会",
      "description": "小红书线索显示海淀卫星厂有两天免费夏日音乐会。发布前需核验场地入口、演出名单和是否预约。",
      "category": "music",
      "date": "2026-07-24",
      "time": "19:00",
      "address": "北京市海淀区知春路甲63号北京卫星制造厂科技园",
      "latitude": 39.97737,
      "longitude": 116.32725,
      "district": "海淀区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "海淀卫星厂",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "海淀", "音乐会", "免费"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a60bca30000000001030713?xsec_token=ABfAdH05DTMb8ejP2lvat4YCvHN7DBjhOghNQBSYTGnGI=&xsec_source=',
    '7.25（周六）朝阳公园免费音乐会',
    $json${
      "title": "朝阳公园免费音乐会",
      "description": "小红书线索显示7月25日朝阳公园有免费音乐会。建议核验活动区域、开始时间和座位/站席信息。",
      "category": "music",
      "date": "2026-07-25",
      "time": "19:00",
      "address": "北京市朝阳区朝阳公园南路1号",
      "latitude": 39.9337,
      "longitude": 116.4781,
      "district": "朝阳区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "朝阳公园活动",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "朝阳公园", "音乐", "免费"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a60b701000000001f01ce35?xsec_token=ABfAdH05DTMb8ejP2lvat4YIYAM4QVJ8n9XsFaTrFMrQU=&xsec_source=',
    '7.25｜中关村·今夜开放麦！！',
    $json${
      "title": "中关村今夜开放麦",
      "description": "小红书线索显示7月25日中关村有开放麦活动。需核验报名方式、场地名称和演出时段。",
      "category": "party",
      "date": "2026-07-25",
      "time": "20:00",
      "address": "北京市海淀区中关村",
      "latitude": 39.9840,
      "longitude": 116.3163,
      "district": "海淀区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "中关村开放麦",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "开放麦", "中关村", "社交"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a61d805000000000f0099cb?xsec_token=ABrfE2tCNClQvHJrb3776KgzxLNYc_RQoqdbTCJV6tiak=&xsec_source=',
    '北京周末免费活动｜首钢园夏日派对🍃',
    $json${
      "title": "首钢园夏日派对",
      "description": "小红书线索显示首钢园有周末夏日派对活动。发布前需核验具体园区点位、活动时段和是否免费。",
      "category": "party",
      "date": "2026-07-26",
      "time": "16:00",
      "address": "北京市石景山区石景山路68号首钢园",
      "latitude": 39.9121,
      "longitude": 116.1695,
      "district": "石景山区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "首钢园",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "首钢园", "派对", "免费"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a3e4cd4000000000f01451a?xsec_token=ABvUwA6V5AYAVLE-4kd_n8USJXI8sbvS3Vd0O0sAUZCNI=&xsec_source=',
    '这个周末顺义一定要来这个超松弛的艺术节',
    $json${
      "title": "顺义松弛感艺术节",
      "description": "小红书线索显示顺义周末有偏艺术生活方式的活动。具体活动名称、园区地址和售票方式需核验。",
      "category": "exhibition",
      "date": "2026-07-26",
      "time": "14:00",
      "address": "北京市顺义区",
      "latitude": 40.1289,
      "longitude": 116.6542,
      "district": "顺义区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "顺义艺术活动",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "顺义", "艺术节", "周末"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a61ce70000000000101cf5e?xsec_token=ABrfE2tCNClQvHJrb3776Kg_di7SvFMNnYMIZaTkRGrOQ=&xsec_source=',
    '北京大融城猫和老鼠快闪全部打卡攻略',
    $json${
      "title": "北京大融城猫和老鼠快闪",
      "description": "小红书线索显示北京大融城有主题快闪打卡活动。发布前需核验展期、商场楼层和是否需要预约。",
      "category": "exhibition",
      "date": "2026-07-25",
      "time": "10:00",
      "address": "北京市朝阳区北京大融城",
      "latitude": 39.9684,
      "longitude": 116.4852,
      "district": "朝阳区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "北京大融城",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "快闪", "展览", "商场"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a45f10d000000000702d0a3?xsec_token=ABamV7Mcl1c9FASxtz-T0QboOJwZKxmb3zE0XVJBeA0lM=&xsec_source=',
    '首届ShakeHub鸡尾酒节，免费喝遍京城顶流酒',
    $json${
      "title": "ShakeHub 鸡尾酒节",
      "description": "小红书线索显示北京有首届ShakeHub鸡尾酒节。建议核验举办场地、参与酒吧、票价和饮酒限制。",
      "category": "bar",
      "date": "2026-07-26",
      "time": "18:00",
      "address": "北京市朝阳区CBD",
      "latitude": 39.9149,
      "longitude": 116.4566,
      "district": "朝阳区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "ShakeHub",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "鸡尾酒", "酒吧", "CBD"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a5ed22200000000130265c7?xsec_token=AB8F3qJPQLDbQnSFHDtyzJzmAiy4wP59FRuTe8tgANFKU=&xsec_source=',
    '北京首个酸酒大会品牌曝光！一站式喝遍🍻',
    $json${
      "title": "北京酸酒大会",
      "description": "小红书线索显示北京有酸酒大会。发布前需核验举办日期、场地、品牌名单和购票方式。",
      "category": "bar",
      "date": "2026-07-26",
      "time": "17:00",
      "address": "北京市朝阳区",
      "latitude": 39.9219,
      "longitude": 116.4436,
      "district": "朝阳区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "酸酒大会",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "酒吧", "酸酒", "饮品"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a1257fb0000000036033450?xsec_token=ABe-kGNXaFl1snpnHB4euIoFuFtQKXpTSGjKO-ldg9AHg=&xsec_source=',
    '🍸一期一会的体验：Old Tower X 庙前冰室',
    $json${
      "title": "Old Tower X 庙前冰室联名酒吧体验",
      "description": "小红书线索显示Old Tower与庙前冰室有联名酒饮体验。需核验日期、是否预约和具体消费规则。",
      "category": "bar",
      "date": "2026-07-25",
      "time": "20:00",
      "address": "北京市东城区鼓楼东大街",
      "latitude": 39.9406,
      "longitude": 116.4032,
      "district": "东城区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "Old Tower / 庙前冰室",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "酒吧", "联名", "鼓楼"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a572571000000001c024b0f?xsec_token=ABFC4Vh1F0wnKjJz57NKxWsRtQnJ0mMbI9vVAtbwTcb2s=&xsec_source=',
    '第六届北京CBD咖啡青年节‼️开票啦',
    $json${
      "title": "第六届北京CBD咖啡青年节",
      "description": "小红书线索显示第六届北京CBD咖啡青年节已开票。发布前需核验具体场地、展期和购票链接。",
      "category": "coffee",
      "date": "2026-07-26",
      "time": "11:00",
      "address": "北京市朝阳区CBD",
      "latitude": 39.9149,
      "longitude": 116.4566,
      "district": "朝阳区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "北京CBD咖啡青年节",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "咖啡", "CBD", "市集"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a3b5d01000000001603cdef?xsec_token=AB6gW9RqWtdC1Srv1dp_wxTG1aVc7qk9pdoKaEJ-kdHyk=&xsec_source=',
    '郎园Station！！好期待车站咖啡节！',
    $json${
      "title": "郎园Station 车站咖啡节",
      "description": "小红书线索显示郎园Station有车站咖啡节。需核验最新展期、开放时间、是否因天气调整。",
      "category": "coffee",
      "date": "2026-07-26",
      "time": "11:00",
      "address": "北京市朝阳区半截塔路53号郎园Station",
      "latitude": 39.9482,
      "longitude": 116.5478,
      "district": "朝阳区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "郎园Station",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "咖啡节", "郎园Station", "市集"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a1972cc000000003700f6b1?xsec_token=ABv-Cvfa1cKvlKEcwGStVTSbJ17aSo5VT72Rg3PNNGJI4=&xsec_source=',
    '北京市集｜归夏咖啡节必喝推荐攻略',
    $json${
      "title": "归夏咖啡节",
      "description": "小红书线索显示北京有归夏咖啡节相关市集。发布前需核验场地、参展品牌和票务情况。",
      "category": "coffee",
      "date": "2026-07-26",
      "time": "12:00",
      "address": "北京市朝阳区",
      "latitude": 39.9219,
      "longitude": 116.4436,
      "district": "朝阳区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "归夏咖啡节",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "咖啡", "市集", "周末"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a61ed59000000000c0175bc?xsec_token=ABrfE2tCNClQvHJrb3776Kg3JfPE2R1DmhXLNyXPOLrgk=&xsec_source=',
    '7月北京hello手账市集来啦！',
    $json${
      "title": "北京 hello 手账市集",
      "description": "小红书线索显示7月有hello手账市集。发布前需核验举办地点、摊主阵容和开放时间。",
      "category": "market",
      "date": "2026-07-26",
      "time": "11:00",
      "address": "北京市朝阳区",
      "latitude": 39.9219,
      "longitude": 116.4436,
      "district": "朝阳区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "hello手账市集",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "手账", "市集", "文创"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a61e4600000000010028c21?xsec_token=ABrfE2tCNClQvHJrb3776Kg_8p-p-2w2pNd2o6pfLrLsE=&xsec_source=',
    '​​北京夏天必逛的酒饮市集，错过后悔一年',
    $json${
      "title": "北京夏日酒饮市集",
      "description": "小红书线索显示北京有夏日酒饮市集。需核验场地、日期、参与品牌和适龄限制。",
      "category": "market",
      "date": "2026-07-26",
      "time": "15:00",
      "address": "北京市朝阳区",
      "latitude": 39.9219,
      "longitude": 116.4436,
      "district": "朝阳区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "北京酒饮市集",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "市集", "酒饮", "夏日"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a35e9d4000000000f032b1a?xsec_token=ABYUMhOlAccyLTJ3qQyJX_r6VCsFRICN7sZyBzm1NUfxs=&xsec_source=',
    '北京📍7月市集&活动合集！清酒节来袭🍶',
    $json${
      "title": "北京清酒节",
      "description": "小红书线索显示7月北京有清酒节相关活动。发布前需核验场地、票价和参与品牌。",
      "category": "bar",
      "date": "2026-07-26",
      "time": "16:00",
      "address": "北京市朝阳区",
      "latitude": 39.9219,
      "longitude": 116.4436,
      "district": "朝阳区",
      "is_free": false,
      "price": 0,
      "ticket_url": "",
      "organizer": "北京清酒节",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "清酒", "酒吧", "市集"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a3f59000000000008025741?xsec_token=ABGrjxPgMP-zSqiELJPvffSckqROdZB3zf9Hjl__rNzo8=&xsec_source=',
    '在树林里办市集⁉️北京新晋治愈好去处🌳',
    $json${
      "title": "北京树林治愈市集",
      "description": "小红书线索显示北京有树林场景的治愈市集。需核验具体地点、日期和摊位内容。",
      "category": "market",
      "date": "2026-07-26",
      "time": "13:00",
      "address": "北京市朝阳区",
      "latitude": 39.9219,
      "longitude": 116.4436,
      "district": "朝阳区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "北京治愈市集",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "市集", "户外", "治愈"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a5c1b660000000001033048?xsec_token=AB0Y7H_G9n4jI0K4FfRKpquqb8pbf0gi-pj7K81CBzw4s=&xsec_source=',
    '7.18📍世界公园免费首周末，带娃一日游全球',
    $json${
      "title": "北京世界公园免费周末游",
      "description": "小红书线索显示世界公园有免费首周末相关活动。需核验是否仍有效、入园方式和适用人群。",
      "category": "sports",
      "date": "2026-07-26",
      "time": "10:00",
      "address": "北京市丰台区花乡大葆台158号北京世界公园",
      "latitude": 39.8117,
      "longitude": 116.2907,
      "district": "丰台区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "北京世界公园",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "公园", "亲子", "户外"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a60e005000000001303e51f?xsec_token=ABfAdH05DTMb8ejP2lvat4YDZzoufIvE_xwZxFVa0otOk=&xsec_source=',
    '天气凉爽 温榆河公园户外遛娃',
    $json${
      "title": "温榆河公园户外遛娃",
      "description": "小红书线索推荐温榆河公园户外亲子玩法。作为地点型候选，发布前需确认入口、路线和是否为活动。",
      "category": "sports",
      "date": "2026-07-26",
      "time": "10:00",
      "address": "北京市朝阳区温榆河公园",
      "latitude": 40.0216,
      "longitude": 116.5705,
      "district": "朝阳区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "温榆河公园",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "公园", "亲子", "户外"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a506f6e000000001702d858?xsec_token=ABLIF2SllVObjt4cUug-PFkrKsw8tC8S7Y5wJTeNYLGVQ=&xsec_source=',
    '户外遛娃｜奥森这片草地，像自带能量场！',
    $json${
      "title": "奥森草地周末户外活动",
      "description": "小红书线索推荐奥林匹克森林公园草地。作为地点型候选，发布前需补充具体玩法和集合点。",
      "category": "sports",
      "date": "2026-07-26",
      "time": "16:00",
      "address": "北京市朝阳区奥林匹克森林公园",
      "latitude": 40.0167,
      "longitude": 116.3965,
      "district": "朝阳区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "奥林匹克森林公园",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "奥森", "户外", "亲子"]
    }$json$::jsonb
  ),
  (
    'https://www.xiaohongshu.com/search_result/6a3e47c50000000007025c49?xsec_token=ABvUwA6V5AYAVLE-4kd_n8UapdaIzPZeQfroJQ59nInQM=&xsec_source=',
    '真的在北京‼️绿堤公园瀑布浅滩美的像海边',
    $json${
      "title": "绿堤公园瀑布浅滩打卡",
      "description": "小红书线索推荐绿堤公园瀑布浅滩。作为地点型候选，发布前需确认开放状态和安全提示。",
      "category": "sports",
      "date": "2026-07-26",
      "time": "15:00",
      "address": "北京市丰台区绿堤公园",
      "latitude": 39.8284,
      "longitude": 116.2440,
      "district": "丰台区",
      "is_free": true,
      "price": 0,
      "ticket_url": "",
      "organizer": "绿堤公园",
      "status": "draft",
      "cover_image": "",
      "tags": ["小红书线索", "公园", "玩水", "户外"]
    }$json$::jsonb
  )
)
INSERT INTO public.event_import_candidates (
  source_platform,
  source_url,
  source_title,
  raw_payload,
  normalized_event,
  status,
  quality_score,
  notes
)
SELECT
  'xiaohongshu',
  source_url,
  source_title,
  jsonb_build_object(
    'source_platform', 'xiaohongshu',
    'source_url', source_url,
    'source_title', source_title,
    'payload', payload,
    'collected_at', now()
  ),
  payload,
  'pending',
  0.55,
  '小红书搜索标题线索。发布时间、详细地址、坐标、价格和图片版权均需人工核验；审核无误后再发布。'
FROM rows
WHERE NOT EXISTS (
  SELECT 1
  FROM public.event_import_candidates existing
  WHERE existing.source_platform = 'xiaohongshu'
    AND existing.source_url = rows.source_url
);
