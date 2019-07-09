//订单支付页面
var app = getApp();

Page({
  //当前页面的数据
  data: {
    orderId: '',
    orderAmount: 0.00,
    paymentType: [],
    userInfo:[], //用户信息
    formId:''//表单ID
  },

  //初始化加载
  onLoad: function (options) {
    var data = JSON.parse(options.data);
    var total = app.common.formatMoney(data.order_amount, 2, '');
    this.setData({
      orderId: data.order_id,
      orderAmount: total
    });
    this.getPaymentType();
    this.getUserInfo();
  },

  getUserInfo:function(){
    var page = this;
    app.api.userInfo(function (res) {
      if (res.status) {
        page.setData({
          userInfo: res.data
        });
      }
    });
  },

  //获取支付类型
  getPaymentType: function () {
    var page = this;
    app.api.getPaymentType(function(res) {
      if (res.status) {
        page.setData({
          paymentType: res.data
        });
      }else{
        app.common.errorToBack('获取支付方式失败', 0);
      }
    });
  },
  //支付用这个方法统一传formid
  payNow:function(e){
    this.data.formId = e.detail.formId;
    var type = e.detail.target.dataset.type;
    if (type == 'balance'){
      this.balance();
    } else if (type == 'offline'){
      this.offline();
    } else if (type == 'wechatPay') {
      this.wechatPay();
    }

  },

  //微信支付触发
  wechatPay: function () {
    //要支付的订单号
    var data = {
      ids: this.data.orderId,
      payment_code: 'wechatpay',
      payment_type: 1,
      params: { formid: this.data.formId}
    };
    //去支付
    app.api.pay(data, function (res) {
        if (res.status) {
            wx.requestPayment({
            'timeStamp': '' + res.data.timeStamp,
            'nonceStr': res.data.nonceStr,
            'package': res.data.package,
            'signType': res.data.signType,
            'paySign': res.data.paySign,
            'success': function (e) {　　　
                if (e.errMsg == "requestPayment:ok") {
                    wx.redirectTo({
                        url: '../../cart/paySuccess/paySuccess?payment_id=' + res.data.payment_id
                    });
                } else if (res.errMsg == 'requestPayment:cancel') {
                    app.common.errorToBack('支付已取消',0);
                }
            },
            'fail': function (e) {
                app.common.errorToBack('支付失败请重新支付', 0);
            }
            });
        } else {
            app.common.errorToBack('支付订单出现问题，请返回重新操作', 0);
        }
    });
  },

  //线下支付触发
  offline: function () {
    var page = this;
    wx.showModal({
      title: '线下支付说明',
      content: '请联系客服进行线下支付',
      cancelText: '订单详情',
      confirmText: '继续购物',
      success: function (res) {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/index/index'
          });
        } else if (res.cancel) {
          wx.redirectTo({
            url: '../../member/order/orderDetail/orderDetail?order_id=' + page.data.orderId
          });
        }
      }
    });
  },
  //余额支付
  balance:function(){
    //要支付的订单号
    var data = {
      ids: this.data.orderId,
      payment_code: 'balancepay',
      payment_type: 1,
      params: { formid: this.data.formId }
    };
    //去支付
    app.api.pay(data, function (res) {
        if (res.status) {
            app.common.errorToShow(res.msg);
            wx.redirectTo({
                url: '../../cart/paySuccess/paySuccess?payment_id=' + res.data.payment_id
            });
        } else {
            app.common.errorToShow(res.msg);
        }
    });
  },
});