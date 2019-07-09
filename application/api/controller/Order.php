<?php
namespace app\api\controller;

use app\common\controller\Api;
use app\common\model\BillAftersales;
use app\common\model\BillPayments;
use app\common\model\BillDelivery;
use app\common\model\BillReship;
use app\common\model\InvoiceRecord;
use app\common\model\Order as orderModel;
use app\common\model\Ship;
use think\facade\Request;

/**
 * 订单模块
 * Class Order
 * @package app\api\controller
 * @author keinx
 */
class Order extends Api
{
    /**
     * 取消订单接口
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function cancel()
    {
        $order_ids = input('order_ids');
        $user_id   = $this->userId;
        $model     = new orderModel();
        $result    = $model->cancel($order_ids, $user_id);
        if ($result !== false) {
            $return_data = array(
                'status' => true,
                'msg'    => '取消订单成功',
                'data'   => $order_ids
            );
        } else {
            $return_data = array(
                'status' => false,
                'msg'    => '取消订单失败',
                'data'   => $order_ids
            );
        }
        return $return_data;
    }


    /**
     * 删除订单接口
     * @return array
     */
    public function del()
    {
        $order_ids = input('order_ids');
        $user_id   = $this->userId;
        $model     = new orderModel();
        $result    = $model->del($order_ids, $user_id);
        if ($result) {
            $return_data = array(
                'status' => true,
                'msg'    => '删除成功',
                'data'   => $order_ids
            );
        } else {
            $return_data = array(
                'status' => false,
                'msg'    => '删除失败',
                'data'   => $order_ids
            );
        }
        return $return_data;
    }


    /**
     * 获取订单详情
     * @return array
     * @throws \think\exception\DbException
     */
    public function details()
    {
        $order_id = input('order_id');
        $user_id  = $this->userId;
        $model    = new orderModel();
        $result   = $model->getOrderInfoByOrderID($order_id, $user_id);
        if ($result) {
            $return_data = array(
                'status' => true,
                'msg'    => '获取成功',
                'data'   => $result
            );
        } else {
            $return_data = array(
                'status' => false,
                'msg'    => '获取失败',
                'data'   => $result
            );
        }
        return $return_data;
    }


    /**
     * 确认收货
     * @return array
     */
    public function confirm()
    {
        $order_id = input('order_id');
        $user_id  = $this->userId;
        $model    = new orderModel();
        $result   = $model->confirm($order_id, $user_id);
        if ($result) {
            $return_data = array(
                'status' => true,
                'msg'    => '确认收货成功',
                'data'   => $order_id
            );
        } else {
            $return_data = array(
                'status' => false,
                'msg'    => '确认收货失败',
                'data'   => $order_id
            );
        }
        return $return_data;
    }


    /**
     * 获取订单列表
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function getList()
    {
        $input = array(
            'order_id'    => input('order_id'),
            'pay_status'  => input('pay_status'),
            'ship_status' => input('ship_status'),
            'start_date'  => input('start_date'),
            'end_date'    => input('end_date'),
            'source'      => input('source'),
            'page'        => input('page'),
            'limit'       => input('limit'),
            'user_id'     => $this->userId
        );
        $model = new orderModel();
        $data  = $model->getListFromApi($input);

        if (count($data['data']) > 0) {
            $return_data = array(
                'status' => true,
                'msg'    => '获取成功',
                'data'   => array(
                    'list'  => $data['data'],
                    'count' => $data['count'],
                )
            );
        } else {
            $return_data = array(
                'status' => false,
                'msg'    => '没有符合的订单',
                'data'   => array(
                    'list'  => $data['data'],
                    'count' => $data['count'],
                )
            );
        }
        return $return_data;
    }


    /**
     * 创建订单
     * @return array
     */
    public function create()
    {
        $delivery['type'] = input('param.receipt_type', 1);          //收货方式,1普通收货地址，2门店自提
        if ($delivery['type'] == 1) {
            //收货地址id
            if (input('?param.uship_id')) {
                $delivery['uship_id'] = input('param.uship_id');
            } else {
                return error_code(13001);
            }
        } else {
            //提货门店
            if (input('?param.store_id')) {
                $delivery['store_id'] = input('param.store_id');
            } else {
                return error_code(13001);
            }
            //提货人姓名
            if (input('?param.lading_name')) {
                $delivery['lading_name'] = input('param.lading_name');
            } else {
                return error_code(13001);
            }
            //提货人电话
            if (input('?param.lading_mobile')) {
                $delivery['lading_mobile'] = input('param.lading_mobile');
            } else {
                return error_code(13001);
            }
        }

        $source = input('param.source', '2');        //来源平台
        $memo   = input('param.memo', '');         //订单备注

        if (!input('?param.cart_ids') || input('param.cart_ids') == "") {
            return error_code(10000);
        } else {
            $cart_ids = input('param.cart_ids');     //必须得传
        }
        $point       = input('param.point', 0);                //使用多少积分
        $coupon_code = input('param.coupon_code', '');       //使用优惠券
        $formId      = input('param.formId', false);                  //仅供微信小程序使用，表单id，用于推送消息

        $tax['tax_type'] = input('param.tax_type', 1);           //发票信息
        $tax['tax_name'] = input('param.tax_name', '');
        $tax['tax_code'] = input('param.tax_code', '');

        $order_type = input('param.order_type', '1');                        //订单类型，1是普通订单，2是拼团订单
        $params     = json_decode(input('param.params', ""), true);               //订单参数，跟type有关系，json格式。`

        $model = new orderModel();
        return $model->toAdd($this->userId, $order_type, $cart_ids, $delivery, $memo, $point, $coupon_code, $formId, $source, $tax, $params);
    }


    /**
     * 获取配送方式
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function getShip()
    {
        $area_id     = input('area_id', 0);
        $return_data = [
            'status' => false,
            'data'   => '',
            'msg'    => '暂未设置配送方式',
        ];
        $model       = new Ship();
        $ship        = $model->getShip($area_id);
        if ($ship) {
            $return_data['status'] = true;
            $return_data['data']   = $ship;
        }
        return $return_data;
    }


    /**
     * 获取订单列表微信小程序
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function getOrderList()
    {
        $input = array(
            'status'  => input('status'),
            'page'    => input('page'),
            'limit'   => input('limit'),
            'user_id' => $this->userId
        );
        $model = new orderModel();
        $data  = $model->getListFromWxApi($input);

        $return_data = array(
            'status' => true,
            'msg'    => '获取成功',
            'data'   => array(
                'list'   => $data['data'],
                'count'  => $data['count'],
                'page'   => $input['page'],
                'limit'  => $input['limit'],
                'status' => $input['status']
            )
        );

        return $return_data;
    }


    /**
     * 获取订单不同状态的数量
     * @return array
     */
    public function getOrderStatusNum()
    {
        $input = array(
            'user_id'     => $this->userId,
            'ids'         => input('ids', '1,2,3,4'),
            'isAfterSale' => Request::param('isAfterSale', false)
        );
        $model = new orderModel();
        $data  = $model->getOrderStatusNum($input);

        if ($data) {
            $return_data = [
                'status' => true,
                'msg'    => '获取成功',
                'data'   => $data
            ];
        } else {
            $return_data = [
                'status' => false,
                'msg'    => '没有符合的数据',
                'data'   => $data
            ];
        }
        return $return_data;
    }


    /**
     * 售后单列表
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function aftersalesList()
    {
        $data    = [
            'page'    => input('page/d', 1),
            'limit'   => input('limit/d', config('jshop.page_limit')),
            'user_id' => $this->userId,
        ];
        $asModel = new BillAftersales();
        return $asModel->getListApi($data);
    }


    /**
     * 售后单详情
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function aftersalesInfo()
    {
        $result = [
            'status' => false,
            'data'   => [],
            'msg'    => ''
        ];

        if (!input("?param.aftersales_id")) {
            return error_code(13222);
        }
        $asModel = new BillAftersales();
        $info    = $asModel->getInfo(input('param.aftersales_id'), $this->userId);
        if (!$info['status']) {
            return $info;
        }

        $reship = [
            'reship_name'    => getSetting('reship_name'),
            'reship_mobile'  => getSetting('reship_mobile'),
            'reship_area'    => get_area(getSetting('reship_area_id')),
            'reship_address' => getSetting('reship_address'),
        ];

        //获取订单状态
        $orderModel                   = new orderModel();
        $owhere[]                     = ['order_id', 'eq', $info['data']['order_id']];
        $orderStatus                  = $orderModel->field('status')->where($owhere)->find();
        $info['data']['order_status'] = $orderStatus['status'];
        $result['data']['info']       = $info['data'];
        $result['data']['reship']     = $reship;
        $result['status']             = true;
        return $result;
    }


    /**
     * 查看订单售后状态
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function aftersalesStatus()
    {
        $result = [
            'status' => false,
            'data'   => [],
            'msg'    => ''
        ];

        if (!input("?param.order_id")) {
            return error_code(13100);
        }
        $asModel   = new BillAftersales();
        $orderInfo = $asModel->orderAftersalesSatatus(input('param.order_id'), $this->userId);
        if ($orderInfo) {
            $result['status'] = true;
            $result['data']   = $orderInfo;
        }
        return $result;
    }


    /**
     * 添加售后单
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function addAftersales()
    {
        if (!input("?param.order_id")) {
            return error_code(13100);
        }
        if (!input("?param.type")) {
            return error_code(10051);
        }

        $items = [];
        $post  = input('param.');
        if (isset($post['items'])) {
            foreach ($post['items'] as $v) {
                $items[$v['id']] = $v['nums'];
            }
        }
        //图片
        $images = [];
        if (isset($post['images'])) {
            $images = $post['images'];
        }

        $refund = input('param.refund/f', 0);        //退款金额，如果type是退款，这个值无所谓，

        //formId
        $formId = input('param.formId', "");

        $billAftersalesModel = new BillAftersales();
        return $billAftersalesModel->toAdd($this->userId, input('param.order_id'), input('param.type'), $items, $images, input('param.reason', ''), $refund, $formId);
    }


    /**
     * 退货单，用户发送退货包裹
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function sendReship()
    {
        if (!input("?param.reship_id")) {
            return error_code(13212);
        }

        if (!input("?param.logi_code")) {
            return error_code(13213);
        }

        if (!input("?param.logi_no")) {
            return error_code(13214);
        }

        $billReshipModel = new BillReship();
        return $billReshipModel->sendReship($this->userId, input('param.reship_id'), input('param.logi_code'), input('param.logi_no'));
    }


    /**
     * 是否可以评价
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function isComment()
    {
        $order_id = input('order_id');
        $user_id  = $this->userId;
        $model    = new orderModel();
        $res      = $model->isOrderComment($order_id, $user_id);
        return $res;
    }


    /**
     * 后台获取订单的物流信息
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function logistics()
    {
        if (!input("?param.order_id")) {
            return error_code(13100);
        }
        $billDeliveryModel = new BillDelivery();
        return $billDeliveryModel->getLogisticsInformation(input('param.order_id'));
    }


    /**
     * 前台物流查询接口
     * @return array|mixed
     */
    public function logisticsByApi()
    {
        $logistic_code = input('param.code');
        $logistic_no   = input('param.no');

        if (!$logistic_code || !$logistic_no) {
            return error_code(13225);
        }

        $billDeliveryModel = new BillDelivery();
        return $billDeliveryModel->getLogistic($logistic_code, $logistic_no);
    }


    /**
     * 获取当月的资金池
     * @return array
     */
    public function getCashPooling()
    {
        $orderModel = new orderModel();
        return $orderModel->cashPooling();
    }


    /**
     * 获取税号
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function getTaxCode()
    {
        $irModel = new InvoiceRecord();
        $name    = Request::param('name');
        return $irModel->getCodeByName($name);
    }
}