<?php
// +----------------------------------------------------------------------
// | JSHOP [ 小程序商城 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2018 http://jihainet.com All rights reserved.
// +----------------------------------------------------------------------
// | Author: tianyu <tianyu@jihainet.com>
// +----------------------------------------------------------------------
namespace app\Manage\controller;

use app\common\controller\Manage;
use app\common\model\Article as articleModel;
use app\common\model\ArticleType as articleTypeModel;
use think\facade\Request;

class Article extends Manage
{


    /**
     * @return mixed
     * @throws \think\exception\DbException
     */
    public function index()
    {
        $article = new articleModel();
        if (Request::isAjax()) {
            return $article->tableData(input('param.'));
        }
        $articleTypeModel = new articleTypeModel();
        $list             = $articleTypeModel->select();
        return $this->fetch('', ['list' => $list]);
    }


    /**
     *  文章添加
     * User:tianyu
     *
     * @return array|mixed
     */
    public function add()
    {
        if (Request::isPost()) {
            $article = new articleModel();
            return $article->addData(input('param.'));
        }
        $articleTypeModel = new articleTypeModel();
        return $this->fetch('add', ['list' => $articleTypeModel->getTree()]);
    }


    /**
     *
     *  文章编辑
     *
     * @return array|mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function edit()
    {
        $articleModel = new articleModel();
        if (Request::isPost()) {
            return $articleModel->saveData(input('param.'));
        }
        $info = $articleModel->with('articleType')->where('id', input('param.id/d'))->find();
        if (!$info) {
            return error_code(10002);
        }
        $articleTypeModel = new articleTypeModel();
        return $this->fetch('edit', ['info' => $info, 'list' => $articleTypeModel->getTree()]);
    }


    /**
     *
     * User:tianyu
     *
     * @return array
     */
    public function del()
    {
        $article = new articleModel();
        $result  = [
            'status' => true,
            'msg'    => '删除成功',
            'data'   => ''
        ];
        if (!$article->destroy(input('param.id/d'))) {
            $result['status'] = false;
            $result['msg']    = '删除失败';
        }
        return $result;
    }

}
