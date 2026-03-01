const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 加载环境变量
let REPLICATE_TOKEN = '';
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const match = envFile.match(/REPLICATE_API_TOKEN=(.+)/);
  if (match) REPLICATE_TOKEN = match[1].trim();
} catch(e) {
  console.log('No .env file found');
}

// 利润计算函数
function calculateProfit(priceCNY, shippingCNY, platformRate, returnRate, usdPrice) {
  const rmbPrice = usdPrice * 7.2;
  const platformIncome = rmbPrice * (1 - platformRate / 100);
  const totalCost = parseFloat(priceCNY) + parseFloat(shippingCNY);
  const returnLoss = rmbPrice * (returnRate / 100);
  const netProfit = platformIncome - totalCost - returnLoss;
  const profitRate = (netProfit / platformIncome * 100).toFixed(1);
  
  return {
    usdPrice,
    rmbPrice: rmbPrice.toFixed(2),
    platformIncome: platformIncome.toFixed(2),
    totalCost: totalCost.toFixed(2),
    returnLoss: returnLoss.toFixed(2),
    netProfit: netProfit.toFixed(2),
    profitRate,
    isProfitable: netProfit > 0
  };
}

// 热门品类数据
const hotCategories = [
  { name: '家居百货', growth: '+15%', competition: '中', profit: '高', products: 1280 },
  { name: '3C数码配件', growth: '+8%', competition: '高', profit: '中', products: 980 },
  { name: '服装配饰', growth: '+12%', competition: '高', profit: '中', products: 1560 },
  { name: '美妆个护', growth: '+20%', competition: '高', profit: '高', products: 870 },
  { name: '儿童玩具', growth: '+25%', competition: '中', profit: '高', products: 650 },
  { name: '宠物用品', growth: '+18%', competition: '低', profit: '高', products: 420 },
  { name: '运动户外', growth: '+10%', competition: '中', profit: '中', products: 780 },
  { name: '汽车用品', growth: '+5%', competition: '低', profit: '中', products: 340 },
];

// 热销产品数据
const hotProducts = [
  { name: '解压捏捏乐', price: 12.99, sales: 23400, category: '儿童玩具', margin: '72%' },
  { name: '手机支架', price: 8.99, sales: 18200, category: '3C配件', margin: '65%' },
  { name: 'LED装饰灯', price: 15.99, sales: 15600, category: '家居百货', margin: '58%' },
  { name: '厨房小工具', price: 9.99, sales: 12300, category: '家居百货', margin: '68%' },
  { name: '宠物玩具', price: 11.99, sales: 9800, category: '宠物用品', margin: '70%' },
  { name: '美甲套装', price: 14.99, sales: 8700, category: '美妆个护', margin: '62%' },
  { name: '瑜伽垫', price: 19.99, sales: 7600, category: '运动户外', margin: '55%' },
  { name: '车载支架', price: 7.99, sales: 6500, category: '汽车用品', margin: '71%' },
];

// 趋势数据
const trendData = [
  { date: '01-25', categories: [120, 98, 145, 87, 65, 42, 78, 34] },
  { date: '01-26', categories: [135, 102, 152, 95, 72, 48, 82, 38] },
  { date: '01-27', categories: [142, 108, 168, 102, 78, 52, 88, 42] },
  { date: '01-28', categories: [156, 115, 175, 110, 85, 58, 92, 45] },
  { date: '01-29', categories: [168, 122, 188, 118, 92, 65, 98, 48] },
  { date: '01-30', categories: [175, 128, 195, 125, 98, 72, 105, 52] },
  { date: '01-31', categories: [182, 135, 202, 132, 105, 78, 112, 55] },
];

// 选品建议
const recommendations = [
  { category: '儿童玩具', growth: '+25%', competition: '中', profit: '高', tips: '解压类、创意DIY、户外玩具', risk: '低' },
  { category: '美妆个护', growth: '+20%', competition: '高', profit: '高', tips: '美甲工具、化妆刷、护肤小工具', risk: '中' },
  { category: '宠物用品', growth: '+18%', competition: '低', profit: '高', tips: '宠物玩具、食具、智能用品', risk: '低' },
  { category: '家居百货', growth: '+15%', competition: '中', profit: '高', tips: '收纳用品、厨房小工具、装饰品', risk: '低' },
  { category: '服装配饰', growth: '+12%', competition: '高', profit: '中', tips: '饰品、帽子、围巾', risk: '中' },
];

// 价格区间分析
const priceRanges = [
  { range: '$5-10', profit: '30-50%', risk: '低', category: '配件、消耗品' },
  { range: '$10-20', profit: '50-70%', risk: '中', category: '主流产品' },
  { range: '$20-30', profit: '60-80%', risk: '中', category: '中高价产品' },
  { range: '$30+', profit: '70%+', risk: '高', category: '高端产品' },
];

// 风险提示
const riskWarnings = [
  { title: '侵权风险', content: '注意产品专利和版权，避免销售仿牌商品' },
  { title: '物流风险', content: '易碎品、液体、电池产品需特殊处理' },
  { title: '平台规则', content: 'TEMU 对质量和发货时效要求严格' },
  { title: '季节性风险', content: '季节性产品需提前备货，注意库存' },
];

// 全托管费用计算
function calculateFullServiceCost(productCost, weight, isOverseas) {
  //  Simplified calculation
  const freight = weight * (isOverseas ? 8 : 25); // 海运 vs 空运
  const serviceFee = productCost * 0.15; // 15% 服务费
  const platformFee = productCost * 0.21; // 21% 平台抽成
  
  return {
    productCost: productCost,
    freight: freight.toFixed(2),
    serviceFee: serviceFee.toFixed(2),
    platformFee: platformFee.toFixed(2),
    totalCost: (productCost + freight + serviceFee + platformFee).toFixed(2)
  };
}

// TEMU 全托管入驻要求
const temuRequirements = [
  { item: '营业执照', required: true, note: '企业或个人工商户' },
  { item: '产品合规资质', required: true, note: 'CE/FCC/FDA等' },
  { item: '仓储能力', required: true, note: '国内仓库或全托管' },
  { item: '发货时效', required: true, note: '48小时内入仓' },
  { item: '资金实力', required: true, note: '备货资金充足' },
];

// 全托管物流方案
const logisticsOptions = [
  { name: '空运小包', time: '7-12天', cost: '¥15-30/kg', suitable: '轻小件、急货', type: '直发' },
  { name: '海运', time: '25-35天', cost: '¥3-8/kg', suitable: '大批量、耐储货', type: '直发' },
  { name: '海外仓', time: '2-5天', cost: '¥20-40/kg', suitable: '高周转产品', type: '托管' },
  { name: 'TEMU仓库', time: '3-7天', cost: '¥12-25/kg', suitable: '全托管', type: '全托管' },
];

// 费用计算
app.post('/api/full-service-cost', (req, res) => {
  const { productCost, weight, isOverseas } = req.body;
  const result = calculateFullServiceCost(productCost, weight, isOverseas);
  res.json(result);
});

app.get('/api/temu-requirements', (req, res) => {
  res.json(temuRequirements);
});

app.get('/api/logistics', (req, res) => {
  res.json(logisticsOptions);
});
const logisticsOptions = [
  { name: '空运小包', time: '7-12天', cost: '¥15-30/kg', suitable: '轻小件、急货' },
  { name: '海运', time: '25-35天', cost: '¥3-8/kg', suitable: '大批量、耐储货' },
  { name: '海外仓', time: '2-5天', cost: '¥20-40/kg', suitable: '高周转产品' },
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/categories', (req, res) => {
  res.json(hotCategories);
});

app.get('/api/products', (req, res) => {
  res.json(hotProducts);
});

app.get('/api/trends', (req, res) => {
  res.json(trendData);
});

app.get('/api/recommendations', (req, res) => {
  res.json(recommendations);
});

app.get('/api/price-ranges', (req, res) => {
  res.json(priceRanges);
});

app.get('/api/risks', (req, res) => {
  res.json(riskWarnings);
});

app.get('/api/logistics', (req, res) => {
  res.json(logisticsOptions);
});

app.post('/api/profit', (req, res) => {
  const { priceCNY, shippingCNY, platformRate, returnRate, usdPrice } = req.body;
  const result = calculateProfit(priceCNY, shippingCNY, platformRate, returnRate, usdPrice);
  res.json(result);
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['profit', 'categories', 'products', 'trends', 'recommendations', 'price-ranges', 'risks', 'logistics', 'ai-image'],
    aiReady: !!REPLICATE_TOKEN
  });
});

// AI 生图 - Nano Banana 2
app.post('/api/ai-image', async (req, res) => {
  const { prompt, imageUrl } = req.body;
  
  if (!REPLICATE_TOKEN) {
    return res.json({ error: 'API Token 未配置' });
  }
  
  try {
    // 调用 Replicate API
    const response = await fetch('https://api.replicate.com/v1/models/google/nano-banana-2/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          image: imageUrl,
          aspect_ratio: '3:4',
          image_size: '1024'
        }
      })
    });
    
    const data = await response.json();
    res.json({ status: 'processing', id: data.id });
  } catch(e) {
    res.json({ error: e.message });
  }
});

// 检查生图状态
app.get('/api/ai-image/:id', async (req, res) => {
  if (!REPLICATE_TOKEN) {
    return res.json({ error: 'API Token 未配置' });
  }
  
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`
      }
    });
    const data = await response.json();
    res.json(data);
  } catch(e) {
    res.json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 TEMU 选品工具 running: http://localhost:${PORT}`);
});
