<?php
namespace app\Manage\controller;

use app\common\controller\Manage;
use app\common\model\BillAftersales;
use app\common\model\Notice;
use app\common\model\Operation;
use app\common\model\Order;
use app\common\model\Promotion;
use think\facade\Cache;
use app\common\model\WeixinAuthor;
use app\common\model\Goods;
use app\common\model\Brand;


class Index extends Manage
{

    public function index(){
        $operationModel = new Operation();
        $this->assign('menu', $operationModel->manageMenu(session('manage')['id']));

        return $this->fetch('index');
    }

    public function welcome()
    {
        $orderModel = new Order();
        //未发货数量
        $unpaid_count = $orderModel->where(['status'=>1,'pay_status'=>1,'ship_status'=>1])->count();
        //待发货数量
        $unship_count = $orderModel->where(['status'=>1,'pay_status'=>2,'ship_status'=>1])->count();
        //待售后数量
        $billAfterSalesModel = new BillAftersales();
        $afterSales_count = $billAfterSalesModel->getCount();

        $this->assign('unpaid_count',$unpaid_count);
        $this->assign('unship_count',$unship_count);
        $this->assign('after_sales_count',$afterSales_count);

        $goodsModel = new Goods();
        $goodsStatics=$goodsModel->staticGoods();
        $this->assign('goods_statics',$goodsStatics);
        hook('adminindex', $this);//后台首页钩子
        return $this->fetch('welcome');
    }

    /**
     * 供tag标签选择品牌的时候使用
     */
    public function tagSelectBrands()
    {
        $this->view->engine->layout(false);
        if(input('param.type') != 'show'){
            $request = input('param.');
            $brandModel = new Brand();
            return $brandModel->tableData($request);
        }else{
            return $this->fetch('tagSelectBrands');
        }
    }
    /**
     * 供tag标签选择商品的时候使用
     */
    public function tagSelectGoods()
    {
        $this->view->engine->layout(false);
        if(input('param.type') != 'show'){
            $request = input('param.');
            $goodModel = new Goods();
            $request['marketable'] = $goodModel::MARKETABLE_UP;     //必须是上架的商品
            return $goodModel->tableData($request);

        }else{
            return $this->fetch('tagSelectGoods');
        }
    }

    /**
     * 清除整站全部缓存
     * 如果其它地方写了缓存的读写方法，一定要有判断是否有缓存的情况！！！
     */
    public function clearCache(){
        Cache::clear();
        $this->success('清除缓存成功','index/welcome');
    }

    /**
     * 供tag标签选择公告的时候用
     */
    public function tagSelectNotice()
    {
        $this->view->engine->layout(false);
        if(input('param.type') != 'show'){
            $request = input('param.');
            $noticeModel = new Notice();
            return $noticeModel->tableData($request);
        }else{
            return $this->fetch('tagSelectNotice');
        }
    }

    /**
     * 供tag标签选择团购秒杀的时候使用
     */
    public function tagSelectGroup()
    {
        $this->view->engine->layout(false);
        if(input('param.type') != 'show'){
            $request = input('param.');
            $promotionModel = new Promotion();
            $request['type'] = [$promotionModel::TYPE_GROUP,$promotionModel::TYPE_SKILL];
            return $promotionModel->tableData($request);
        }else{
            return $this->fetch('tagSelectGroup');
        }
    }


}
