/* 静态映射表：IP 工具箱中文翻译用（零调用、即时）。
 * 由 index.html 经 <script src="./tables.js"></script> 在主线脚本前载入，挂为全局变量。
 * 含：ALIASES / CN_COUNTRIES / CN_ISO2 / CN_PROV_GBT2260 / CN_ISP_ABBR（及派生 CN_PROV_ABBREV）。 */
var ALIASES = {
  isp: ['organisation','org','llc'],
  country: ['country_name'],
  region: ['province','prov','regionName'],
  address: ['addr','location'],
  ip: ['query','client_ip','di'],
  org: ['organisation'],
  lon: ['longitude'],
  lat: ['latitude']
};
/* 英文国名 -> 中文（仅匹配英文键，已返回中文的源不受影响）。
 * 含中国港澳台，按属地表述。应用于 country / country_name 字段。 */
var CN_COUNTRIES = {
  'China':'中国','Hong Kong':'中国香港','Macao':'中国澳门','Taiwan':'中国台湾',
  'United States':'美国','United Kingdom':'英国','Japan':'日本','South Korea':'韩国',
  'Korea':'韩国','North Korea':'朝鲜','Russia':'俄罗斯','Germany':'德国','France':'法国',
  'Canada':'加拿大','Australia':'澳大利亚','Singapore':'新加坡','India':'印度',
  'Brazil':'巴西','Netherlands':'荷兰','Spain':'西班牙','Italy':'意大利',
  'Indonesia':'印度尼西亚','Thailand':'泰国','Vietnam':'越南','Malaysia':'马来西亚',
  'Philippines':'菲律宾','Turkey':'土耳其','Ukraine':'乌克兰','Poland':'波兰',
  'Sweden':'瑞典','Norway':'挪威','Finland':'芬兰','Ireland':'爱尔兰',
  'Switzerland':'瑞士','Austria':'奥地利','Belgium':'比利时','Portugal':'葡萄牙',
  'Mexico':'墨西哥','Argentina':'阿根廷','Chile':'智利','South Africa':'南非',
  'New Zealand':'新西兰','Denmark':'丹麦','Czech Republic':'捷克','Greece':'希腊',
  'Romania':'罗马尼亚','Hungary':'匈牙利','Bulgaria':'保加利亚','Croatia':'克罗地亚',
  'Egypt':'埃及','Saudi Arabia':'沙特阿拉伯','Iran':'伊朗','Iraq':'伊拉克',
  'Israel':'以色列','United Arab Emirates':'阿联酋','Nigeria':'尼日利亚','Kenya':'肯尼亚',
  'Pakistan':'巴基斯坦','Bangladesh':'孟加拉国','Sri Lanka':'斯里兰卡',
  'Mongolia':'蒙古','Kazakhstan':'哈萨克斯坦','Laos':'老挝','Myanmar':'缅甸',
  'Cambodia':'柬埔寨','Nepal':'尼泊尔','Kyrgyzstan':'吉尔吉斯斯坦',
  'Luxembourg':'卢森堡','Iceland':'冰岛','Estonia':'爱沙尼亚','Latvia':'拉脱维亚',
  'Lithuania':'立陶宛','Slovakia':'斯洛伐克','Slovenia':'斯洛文尼亚',
  'Azerbaijan':'阿塞拜疆','Qatar':'卡塔尔','Kuwait':'科威特','Jordan':'约旦',
  'Lebanon':'黎巴嫩','Oman':'阿曼','Colombia':'哥伦比亚','Peru':'秘鲁',
  'Venezuela':'委内瑞拉','Ecuador':'厄瓜多尔','Uruguay':'乌拉圭',
  'Costa Rica':'哥斯达黎加','Panama':'巴拿马','Guatemala':'危地马拉'
};
/* ISO 3166-1 alpha-2 国家代码 -> 中文（bdip 等接口返回二字码时用） */
var CN_ISO2 = {
  'CN':'中国','HK':'中国香港','MO':'中国澳门','TW':'中国台湾',
  'US':'美国','GB':'英国','JP':'日本','KR':'韩国','KP':'朝鲜','RU':'俄罗斯','DE':'德国','FR':'法国',
  'CA':'加拿大','AU':'澳大利亚','SG':'新加坡','IN':'印度','BR':'巴西','NL':'荷兰','ES':'西班牙','IT':'意大利',
  'ID':'印度尼西亚','TH':'泰国','VN':'越南','MY':'马来西亚','PH':'菲律宾','TR':'土耳其','UA':'乌克兰','PL':'波兰',
  'SE':'瑞典','NO':'挪威','FI':'芬兰','IE':'爱尔兰','CH':'瑞士','AT':'奥地利','BE':'比利时','PT':'葡萄牙',
  'MX':'墨西哥','AR':'阿根廷','CL':'智利','ZA':'南非','NZ':'新西兰','DK':'丹麦','CZ':'捷克','GR':'希腊',
  'RO':'罗马尼亚','HU':'匈牙利','BG':'保加利亚','HR':'克罗地亚','EG':'埃及','SA':'沙特阿拉伯','IR':'伊朗',
  'IQ':'伊拉克','IL':'以色列','AE':'阿联酋','NG':'尼日利亚','KE':'肯尼亚','PK':'巴基斯坦','BD':'孟加拉国',
  'LK':'斯里兰卡','MN':'蒙古','KZ':'哈萨克斯坦','LA':'老挝','MM':'缅甸','KH':'柬埔寨','NP':'尼泊尔',
  'KG':'吉尔吉斯斯坦','LU':'卢森堡','IS':'冰岛','EE':'爱沙尼亚','LV':'拉脱维亚','LT':'立陶宛','SK':'斯洛伐克',
  'SI':'斯洛文尼亚','RS':'塞尔维亚','BY':'白俄罗斯','GE':'格鲁吉亚','AM':'亚美尼亚','AZ':'阿塞拜疆','QA':'卡塔尔',
  'KW':'科威特','JO':'约旦','LB':'黎巴嫩','OM':'阿曼','CO':'哥伦比亚','PE':'秘鲁','VE':'委内瑞拉','EC':'厄瓜多尔',
  'UY':'乌拉圭','CR':'哥斯达黎加','PA':'巴拿马','GT':'危地马拉'
};
/* 中华人民共和国行政区划代码 GB/T 2260-2007（表1：省/自治区/直辖市/特别行政区）
 * code = 6 位数字码；name = 全称；abbr = 字母码（部分 IP 归属地接口称“字幕码”）
 * 来源：国家标准化管理委员会 GB/T 2260-2007 表1 */
var CN_PROV_GBT2260 = [
  {code:'110000', name:'北京市',            abbr:'BJ'},
  {code:'120000', name:'天津市',            abbr:'TJ'},
  {code:'130000', name:'河北省',            abbr:'HE'},
  {code:'140000', name:'山西省',            abbr:'SX'},
  {code:'150000', name:'内蒙古自治区',      abbr:'NM'},
  {code:'210000', name:'辽宁省',            abbr:'LN'},
  {code:'220000', name:'吉林省',            abbr:'JL'},
  {code:'230000', name:'黑龙江省',          abbr:'HL'},
  {code:'310000', name:'上海市',            abbr:'SH'},
  {code:'320000', name:'江苏省',            abbr:'JS'},
  {code:'330000', name:'浙江省',            abbr:'ZJ'},
  {code:'340000', name:'安徽省',            abbr:'AH'},
  {code:'350000', name:'福建省',            abbr:'FJ'},
  {code:'360000', name:'江西省',            abbr:'JX'},
  {code:'370000', name:'山东省',            abbr:'SD'},
  {code:'410000', name:'河南省',            abbr:'HA'},
  {code:'420000', name:'湖北省',            abbr:'HB'},
  {code:'430000', name:'湖南省',            abbr:'HN'},
  {code:'440000', name:'广东省',            abbr:'GD'},
  {code:'450000', name:'广西壮族自治区',    abbr:'GX'},
  {code:'460000', name:'海南省',            abbr:'HI'},
  {code:'500000', name:'重庆市',            abbr:'CQ'},
  {code:'510000', name:'四川省',            abbr:'SC'},
  {code:'520000', name:'贵州省',            abbr:'GZ'},
  {code:'530000', name:'云南省',            abbr:'YN'},
  {code:'540000', name:'西藏自治区',        abbr:'XZ'},
  {code:'610000', name:'陕西省',            abbr:'SN'},
  {code:'620000', name:'甘肃省',            abbr:'GS'},
  {code:'630000', name:'青海省',            abbr:'QH'},
  {code:'640000', name:'宁夏回族自治区',    abbr:'NX'},
  {code:'650000', name:'新疆维吾尔自治区',  abbr:'XJ'},
  {code:'710000', name:'台湾省',            abbr:'TW'},
  {code:'810000', name:'香港特别行政区',    abbr:'HK'},
  {code:'820000', name:'澳门特别行政区',    abbr:'MO'}
];
/* 字母码(字幕码) -> 全称（静态翻译，零调用） */
var CN_PROV_ABBREV = {};
CN_PROV_GBT2260.forEach(function(p){ CN_PROV_ABBREV[p.abbr] = p.name; });
/* 运营商简称静态表：ISP 码 / 英文全称 -> 中文简称（零调用、即时；不依赖百度 Worker）
 * 用于把运营商字段（爱奇艺 ISP 码、IP.SB/Hsselite 等英文全称）翻成中文简称。
 * 既含整词组（"China Telecom"），也含单词兜底（"Telecom"）；噪声词(LLC/Inc/com...)映射空串以剔除。 */
var CN_ISP_ABBR = {
  // 爱奇艺 ISP 码
  'CMNET':'移动','CMCC':'移动','CUCC':'联通','CTCC':'电信','CRTC':'铁通','CBN':'广电',
  'CTTL':'电信通','CNC':'网通','CMHK':'移动香港','CUHK':'联通香港','CNISP':'广电','SAT':'卫星','CERNET':'教育网',
  // 爱奇艺 ISP 码（2 位短码：v.f4v 接口实际返回，如 CT/CM/CU；与上方 4 位企业码并存，互不匹配）
  'CT':'电信','CM':'移动','CU':'联通','GWBN':'长宽','DRPENG':'鹏博士','CMTIETONG':'铁通','FXDATA':'飞享','TOPWAY':'天威视讯','GAMEFAST':'游驰','WEXCHANGE':'驰联','PCCW':'电讯盈科','CNEAN':'亿安天下','HKBN':'香港宽频','WATONE':'华通云','WASU':'华数','GDM':'珠江数码','FOUNDER':'方正宽带','OTHERS':'其他',
  // 英文全称（整词组）
  'China Telecom':'电信','China Unicom':'联通','China Mobile':'移动','China TieTong':'铁通','China Satcom':'卫星','China Railcom':'铁通',
  'Google LLC':'Google','Google Inc':'Google','Alphabet':'Google','Amazon.com':'Amazon','Amazon com':'Amazon','Amazon Inc':'Amazon',
  'Microsoft':'微软','Cloudflare':'Cloudflare','Apple':'苹果','Meta':'Meta','Facebook':'Meta','Netflix':'Netflix','Oracle':'甲骨文','IBM':'IBM',
  'Tencent':'腾讯','Alibaba':'阿里','Baidu':'百度','Comcast':'康卡斯特','AT&T':'AT&T','Verizon':'Verizon','Telia':'Telia',
  'Hetzner':'Hetzner','OVH':'OVH','DigitalOcean':'DigitalOcean','Linode':'Linode','Vultr':'Vultr','SoftBank':'软银','NTT':'NTT','KDDI':'KDDI',
  'Deutsche Telekom':'德国电信','Vodafone':'沃达丰','Orange':'Orange','Telstra':'Telstra','Singtel':'Singtel','Tata Communications':'塔塔','Level 3':'Level3','CenturyLink':'CenturyLink',
  'Spectrum':'Spectrum','Cox':'Cox','Charter':'Charter','Cogent':'Cogent','Hurricane Electric':'HE','Google':'Google',
  // 单词兜底
  'Telecom':'电信','Unicom':'联通','Mobile':'移动','Communications':'通信','Communication':'通信','Network':'网络','Networks':'网络',
  'Hosting':'主机','Solutions':'方案','Technology':'科技','Technologies':'科技','Systems':'系统','System':'系统','Digital':'数字',
  'Data':'数据','Datacenter':'数据中心','Center':'中心','Global':'全球','International':'国际','Group':'集团','Services':'服务','Cloud':'云','Media':'媒体',
  'Corporation':'','Corp':'','Limited':'','Ltd':'','Inc':'','LLC':'','Co':'','Company':'','Computing':'','Holdings':'','LLP':''
};
