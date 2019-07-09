<?php
// +----------------------------------------------------------------------
// | JSHOP [ 小程序商城 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2018 http://jihainet.com All rights reserved.
// +----------------------------------------------------------------------
// | Author: tianyu <tianyu@jihainet.com>
// +----------------------------------------------------------------------

namespace app\Manage\controller;

use  app\common\controller\Manage;
use app\common\model\ArticleType as articleTypeModel;
use think\facade\Request;

class  ArticleType extends Manage
{

    /**
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function index()
    {
        $articleTypeModel = new ArticleTypeModel();
        if(Request::isAjax())
        {
            return $articleTypeModel->tableData(input('param.'));
        }
        return $this->fetch();
    }

    /**
     *
     *  分类添加
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function add()
    {
        $articleTypeModel = new ArticleTypeModel();
        $this->view->engine->layout(false);
        if(Request::isPost())
        {
            return $articleTypeModel->addData(input('param.'));
        }
        $list = $articleTypeModel->select();
        return $this->fetch('',['list' => $articleTypeModel->getTree($list)]);
    }


    /**
     *
     *  添加子分类
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function addSon()
    {
        $articleTypeModel = new ArticleTypeModel();
        $this->view->engine->layout(false);
        $typeInfo = $articleTypeModel->where('id',input('param.id/d'))->find();
        if (!$typeInfo) return error_code(10002);
        return $this->fetch('addson',['typeInfo'=>$typeInfo]);
    }


    /**
     *
     *  文章分类编辑
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function edit()
    {
        $this->view->engine->layout(false);
        $articleTypeModel = new ArticleTypeModel();
        if(Request::isPost())
        {
            return $articleTypeModel->editData(input('param.'));
        }
        $typeInfo = $articleTypeModel->where('id',input('param.id/d'))->find();
        if (!$typeInfo) return error_code(10002);
        return $this->fetch('',['typeInfo'=>$typeInfo]);
    }


    /**
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function del()
    {
        $articleTypeModel = new ArticleTypeModel();
        $result = ['status'=>true, 'msg'=>'删除成功','data'=>''];
        //判断该分类下是否有子分类
        if($articleTypeModel->where('pid',input('param.id/d'))->find()) {
            $result['status'] = false;
            $result['msg'] = '该分类下有子分类无法删除';
        } else if($articleTypeModel->comments()->where('type_id',input('param.id/d'))->find()) {
            $result['status'] = false;
            $result['msg'] = '该分类下有文章无法删除';
        } else {
            if (!$articleTypeModel->where('id',input('param.id/d'))->delete()) {
                $result['status'] = false;
                $result['msg'] = '删除失败';
            }
        }

        return $result;
    }
}
