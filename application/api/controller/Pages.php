<?php
namespace app\api\controller;
use app\common\controller\Api;
use app\common\model\Order;
use app\common\model\User;

/**
 * 自定义布局
 * Class Pages
 * @package app\api\controller
 */
class Pages extends Api
{
    public function getPageConfig()
    {
        $result             = [
            'status' => true,
            'msg'    => '获取成功',
            'data'   => []
        ];
        $input['page_code'] = input('code/s', 'mobile_home');
        $pageModel          = new \app\common\model\Pages();
        $result             = $pageModel->getDetails($input['page_code']);
        return $result;
    }

    /**
     *
     */
    public function getRecod()
    {
        $return = [
            'status' => true,
            'msg'    => '获取成功',
            'data'   => []
        ];
        /***
         * 随机数
         * 其它随机数据，需要自己补充
         */
        $avatar   = _sImage();
        $randUser = [
            [
                'avatar'   => $avatar,
                'nickname' => '失望中的绝望',
                'ctime'    => time_ago(time() - rand(100, 1000)),
                'desc'     => '下单成功',
            ],
            [
                'avatar'   => $avatar,
                'nickname' => '一半爱情',
                'ctime'    => time_ago(time() - rand(100, 1000)),
                'desc'     => '下单成功',
            ],
            [
                'avatar'   => $avatar,
                'nickname' => '最繁华时最悲凉',
                'ctime'    => time_ago(time() - rand(100, 1000)),
                'desc'     => '下单成功',
            ],
            [
                'avatar'   => $avatar,
                'nickname' => '哎哟喂',
                'ctime'    => time_ago(time() - rand(100, 1000)),
                'desc'     => '下单成功',
            ],
            [
                'avatar'   => $avatar,
                'nickname' => '枫无痕',
                'ctime'    => time_ago(time() - rand(100, 1000)),
                'desc'     => '下单成功',
            ],
        ];
        $type     = input('type/s', 'home');
        $value    = input('value', '');
        if ($type == 'home') {
            //数据库里面随机取出来几条数据
            $orderModel = new Order();
            $orders     = $orderModel->order('ctime desc')->field('order_id,user_id,ctime')->limit(0, 5)->select();
            if (!$orders->isEmpty()) {
                $order     = $orders[rand(0, 4)];
                $info      = [];
                $userModel = new User();
                if (isset($order['user_id']) && $order['user_id']) {
                    $user           = $userModel->where('id', $order['user_id'])->field('nickname,avatar')->find();
                    $return['data'] = [
                        'avatar'   => _sImage($user['avatar']),
                        'nickname' => $user['nickname'],
                        'ctime'    => time_ago($order['ctime']),
                        'desc'     => '下单成功',
                    ];
                }
            } else {
                $return['data'] = $randUser[rand(0, 4)];
            }
        }
        return $return;
    }
}