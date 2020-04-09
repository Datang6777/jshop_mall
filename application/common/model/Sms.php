<?php

namespace app\common\model;


class Sms extends Common
{

    const STATUS_UNUSED = 1;        //状态 未使用
    const STATUS_USED = 2;          //已使用

    //短信类型，这里的短信类型千万不要和message_center表里的类型冲突掉，哪里是总的类型，这里的是此模型特有的类型
    public $sms_tpl = [
        'reg' => [
            'name' => '用户注册',
            'check' => true
        ],
        'login' => [
            'name' => '用户登陆',
            'check' => true
        ],
        'veri' => [
            'name' => '短信校验',
            'check' => true
        ],


    ];

    public function send($mobile,$code,$params)
    {
        if(!$mobile){
            return error_code(11051);
        }
        //如果是登陆注册等的短信，增加校验
        if($code == 'reg' || $code == 'login' || $code== 'veri'){
            $where[] = ['mobile', 'eq', $mobile];
            $where[] = ['code', 'eq', $code];
            $where[] = ['ctime', 'gt', time()-60*10];
            //$where[] = ['ip', 'eq', get_client_ip()];  //先暂时注释，不做ip检查
            $where[] = ['status', 'eq', self::STATUS_UNUSED];

            $smsInfo = $this->where($where)->order('id desc')->find();
            if($smsInfo){
                if(time() - $smsInfo['ctime'] < 60){
                    return array('status'=>false,'msg'=>"两次发送时间间隔小于60秒");
                }
                $params = json_decode($smsInfo['params'],true);
            }else{
                $params = [
                    'code'=> rand(100000,999999)
                ];
            }
            $status = self::STATUS_UNUSED;
        }else{
            $status = self::STATUS_USED;
        }
        $str = $this->temp($code,$params);
        if($str == ''){
            return error_code(10009);
        }
        $data['mobile'] = $mobile;
        $data['code'] = $code;
        $data['params'] = json_encode($params);
        $data['content'] = $str;
        $data['ctime'] = time();
        $data['ip'] = get_client_ip(0,true);
        $data['status'] = $status;
        $this->save($data);



        $re = $this->send_sms($mobile,$str,$code,$params);
        return $re;
    }

    public function check($phone,$ver_code,$code){

        $where[] = ['mobile', 'eq', $phone];
        $where[] = ['code', 'eq', $code];
        $where[] = ['ctime', 'gt', time()-60*10];

        //$where[] = ['ip', 'eq', get_client_ip()]; #先屏蔽ip检查，避免增加cdn或代理ip时出现问题

        $where[] = ['status', 'eq', self::STATUS_UNUSED];
        $sms_info = $this->where($where)->order('id desc')->find();
        if($sms_info){
            $params = json_decode($sms_info['params'],true);
            if($params['code'] == $ver_code){
                $this->save(array('status'=>self::STATUS_USED),$where);
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    }

    private function temp($code,$params){
        $msg = '';
        switch ($code)
        {
            case 'reg':
                // 账户注册
                // $params['code'] = 验证码
                $msg = "您正在注册账号，验证码是".$params['code']."，请勿告诉他人。";
                break;
            case 'login':
                // 账户登录
                // $params['code'] = 验证码
                $msg = "您正在登陆账号，验证码是".$params['code']."，请勿告诉他人。";
                break;
            case 'veri':
                // 验证验证码
                // $params['code'] = 验证码
                $msg = "您的验证码是".$params['code']."，请勿告诉他人。";
                break;
            case 'create_order':
                // 订单创建
                // $params['order_id'] = 订单号
                // $params['ship_addr'] = 收货详细地址包含省市区
                // $params['ship_name'] = 收货人姓名
                // $params['ship_mobile'] = 收货人手机号
                // $params['goods_amount'] = 商品总价
                // $params['cost_freight'] = 快递费
                // $params['order_amount'] = 订单总价 = 商品总价+快递费
                // $params['point'] = 使用抵扣积分单位个
                // $params['point_money'] = 积分抵扣金额单位元
                // $params['order_pmt'] = 订单优惠单位元
                // $params['goods_pmt'] = 商品优惠单位元
                // $params['coupon_pmt'] = 优惠券优惠单位元
                // $params['memo'] = 下单买家备注
                $msg = "恭喜您，订单创建成功,祝您购物愉快。";
                break;
            case 'order_payed':
                // 订单支付通知买家
                // $params['order_id'] = 订单号
                // $params['goods_amount'] = 商品总价
                // $params['cost_freight'] = 快递费
                // $params['order_amount'] = 订单总价
                // $params['money'] = 支付金额
                // $params['pay_time'] = 支付时间
                // $params['point'] = 使用抵扣积分单位个
                // $params['point_money'] = 积分抵扣金额单位元
                // $params['order_pmt'] = 订单优惠单位元
                // $params['goods_pmt'] = 商品优惠单位元
                // $params['coupon_pmt'] = 优惠券优惠单位元
                // $params['memo'] = 下单买家备注
                // $params['user_name'] = 买家昵称
                $msg = "恭喜您，订单支付成功,祝您购物愉快。";
                break;
            case 'remind_order_pay':
                // 未支付催单
                // $params['order_id'] = 订单号
                // $params['goods_amount'] = 商品总价
                // $params['cost_freight'] = 快递费
                // $params['order_amount'] = 订单总价
                // $params['money'] = 支付金额
                // $params['pay_time'] = 支付时间
                // $params['point'] = 使用抵扣积分单位个
                // $params['point_money'] = 积分抵扣金额单位元
                // $params['order_pmt'] = 订单优惠单位元
                // $params['goods_pmt'] = 商品优惠单位元
                // $params['coupon_pmt'] = 优惠券优惠单位元
                // $params['memo'] = 下单买家备注
                // $params['user_name'] = 买家昵称
                $msg = "您的订单还有1个小时就要取消了，请及时进行支付。";
                break;
            case 'delivery_notice':
                // 订单发货
                // $params['order_id'] = 订单号
                // $params['goods_amount'] = 商品总价
                // $params['cost_freight'] = 快递费
                // $params['order_amount'] = 订单总价
                // $params['money'] = 支付金额
                // $params['pay_time'] = 支付时间
                // $params['point'] = 使用抵扣积分单位个
                // $params['point_money'] = 积分抵扣金额单位元
                // $params['order_pmt'] = 订单优惠单位元
                // $params['goods_pmt'] = 商品优惠单位元
                // $params['coupon_pmt'] = 优惠券优惠单位元
                // $params['memo'] = 下单买家备注
                // $params['user_name'] = 买家昵称
                // $params['logistics_name'] = 快递公司
                // $params['ship_no'] = 快递编号
                // $params['ship_name'] = 收货人姓名
                // $params['ship_mobile'] = 收货人电话
                // $params['ship_addr'] = 收货详细地址
                $msg = "您好，您的订单已经发货。";
                break;
            case 'aftersales_pass':
                // 售后审核通过
                // $params['order_id'] = 订单号
                // $params['goods_amount'] = 商品总价
                // $params['cost_freight'] = 快递费
                // $params['order_amount'] = 订单总价
                // $params['money'] = 支付金额
                // $params['pay_time'] = 支付时间
                // $params['point'] = 使用抵扣积分单位个
                // $params['point_money'] = 积分抵扣金额单位元
                // $params['order_pmt'] = 订单优惠单位元
                // $params['goods_pmt'] = 商品优惠单位元
                // $params['coupon_pmt'] = 优惠券优惠单位元
                // $params['memo'] = 下单买家备注
                // $params['user_name'] = 买家昵称
                // $params['aftersales_id'] = 售后单号
                $msg = "您好，您的售后已经通过。";
                break;
            case 'refund_success':
                // 退款已处理
                // $params['refund_id'] = 退款单ID
                // $params['aftersales_id'] = 售后单id
                // $params['money'] = 退款金额
                // $params['type'] = 1=订单 2=充值单
                // $params['source_id'] = 订单或充值单ID
                $msg = "用户您好，您的退款已经处理，请确认。";
                break;
            case 'seller_order_notice':
                // 订单支付通知卖家
                // $params['order_id'] = 订单号
                // $params['goods_amount'] = 商品总价
                // $params['cost_freight'] = 快递费
                // $params['order_amount'] = 订单总价
                // $params['money'] = 支付金额
                // $params['pay_time'] = 支付时间
                // $params['point'] = 使用抵扣积分单位个
                // $params['point_money'] = 积分抵扣金额单位元
                // $params['order_pmt'] = 订单优惠单位元
                // $params['goods_pmt'] = 商品优惠单位元
                // $params['coupon_pmt'] = 优惠券优惠单位元
                // $params['memo'] = 下单买家备注
                // $params['user_name'] = 买家昵称
                $msg = "您有新的订单了，请及时处理。";
                break;
            case 'common':
                $msg = $params['tpl'];
                break;
        }
        return $msg;
    }

    /***
     * 发送短信
     * @param $mobile
     * @param $content
     * @param $code
     * @param $params
     * @return array
     */
    private function send_sms($mobile, $content, $code, $params)
    {
        $result = [
            'status' => true,
            'data' => '',
            'msg' => '发送成功'
        ];
        $re = hook('sendsms', ['params' => [
            'mobile'  => $mobile,
            'content' => $content,
            'code'    => $code,
            'params'  => $params,
        ]]);
        if($re && is_array($re)){
            if (isset($re[0]['status']) && $re[0]['status']) {
//                $result['status'] = true;
//                $result['msg'] = '发送成功';
            } else {
                $result['status'] = false;
                $result['msg'] = isset($re[0]['msg']) ? $re[0]['msg'] : '发送失败';
            }
        }
        return $result;
    }


    protected function tableWhere($post)
    {
        $where = [];

        if(isset($post['id']) && $post['id'] != ""){
            $where[] = ['id', 'eq', $post['id']];
        }
        if(isset($post['mobile']) && $post['mobile'] != ""){
            $where[] = ['mobile', 'eq', $post['mobile']];
        }
        if(isset($post['code']) && $post['code'] != ""){
            $where[] = ['code', 'eq', $post['code']];
        }
        if(isset($post['ip']) && $post['ip'] != ""){
            $where[] = ['ip', 'eq', $post['ip']];
        }

        if(input('?param.date')){
            $theDate = explode(' 到 ',input('param.date'));
            if(count($theDate) == 2){
                $where[] = ['ctime', '<', strtotime($theDate[1])];
                $where[] = ['ctime', '>', strtotime($theDate[0])];
            }
        }


        if(isset($post['status']) && $post['status'] != ""){
            $where[] = ['status', 'eq', $post['status']];
        }

        $result['where'] = $where;
        $result['field'] = "*";
        $result['order'] = "ctime desc";
        return $result;
    }

    /**
     * 根据查询结果，格式化数据
     * @author sin
     * @param $list
     * @return mixed
     */
    protected function tableFormat($list)
    {
        foreach($list as $k => $v) {
            if($v['status']) {
                $list[$k]['status'] = config('params.sms')['status'][$v['status']];
            }

            if($v['ctime']) {
                $list[$k]['ctime'] = getTime($v['ctime']);
            }

        }
        return $list;
    }


}