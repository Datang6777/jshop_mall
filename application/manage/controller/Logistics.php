<?php
// +----------------------------------------------------------------------
// | JSHOP [ 小程序商城 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2018 http://jihainet.com All rights reserved.
// +----------------------------------------------------------------------
// | Author: mark <jima@jihainet.com>
// +----------------------------------------------------------------------

namespace app\Manage\controller;

use app\common\controller\Manage;
use app\common\model\Logistics as LogisticsModel;
use Request;

class Logistics extends Manage
{


    public function index()
    {
        if(Request::isAjax()) {
            $logModel = new LogisticsModel();
            return $logModel->tableData(input('request.'));
        }
        return $this->fetch();

    }



    public function add()
    {
        $this->view->engine->layout(false);
        if(Request::isPost())
        {
            $return_data = [
                'status' => false,
                'msg'    => '添加失败',
                'data'   => ''
            ];
            //存储添加内容
            $data = [
                'logi_name' => input('post.logi_name'),
                'logi_code' => input('post.logi_code'),
                'sort' => input('post.sort'),
            ];
            $logModel = new LogisticsModel();
            $result = $logModel->add($data);
            if($result !== false)
            {
                $return_data = [
                    'status' => true,
                    'msg'    => '添加成功',
                    'data'   => $result
                ];
            }
            return $return_data;
        }
        return $this->fetch('add');

    }



    public function edit()
    {
        $this->view->engine->layout(false);
        $logModel = new LogisticsModel();
        if(Request::isPost())
        {
            return $logModel->saveData(input('param.'));

        }
        $data = $logModel->getInfo(input('param.id/d'));
        $this->assign('data',$data);
        return $this->fetch('edit');
    }

    /**
     * 删除物流公司
     * @return array
     */
    public function del()
    {
        $return_data = [
            'status' => false,
            'msg'    => '删除失败',
            'data'   => ''
        ];
        $logModel = new LogisticsModel();
        $id = input('post.id/d',0);
        if(!$id){
            return $return_data;
        }
        if($logModel->where(['id'=>$id])->delete()){
            $return_data['msg'] = '删除成功';
            $return_data['status'] = true;
        }
        return $return_data;
    }


}