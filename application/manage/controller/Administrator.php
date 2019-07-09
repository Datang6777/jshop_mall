<?php
// +----------------------------------------------------------------------
// | JSHOP [ 小程序商城 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2018 http://jihainet.com All rights reserved.
// +----------------------------------------------------------------------
// | Author: mark <jima@jihainet.com>
// +----------------------------------------------------------------------

namespace app\manage\controller;
use app\common\controller\Manage as ManageController;
use app\common\model\ManageRole;
use app\common\model\Manage as ManageModel;
use app\common\model\ManageRoleRel;
use think\facade\Request;
use org\Curl;


class Administrator extends ManageController
{

    public function index()
    {
        if(Request::isAjax()){
            $manageModel = new ManageModel();
            return $manageModel->tableData([]);
        }else{
            return $this->fetch('index');
        }
    }

    public function add()
    {
        $this->view->engine->layout(false);
        $manageModel = new ManageModel();
        $manageRoleModel = new ManageRole();
        $manageRoleList = $manageRoleModel->select();

        if(Request::isPost()){
            if(!input('?param.username') || input('param.username') == ""){
                return error_code(11008);
            }
            if(!input('?param.mobile') || input('param.mobile') == ""){
                return error_code(11080);
            }
            if(!input('?param.password') || strlen(input('param.password')) < 6 || strlen(input('param.password')) > 16){
                return error_code(11009);
            }
            return $manageModel->toAdd(input('param.'));
        }
        $this->assign('roleList',$manageRoleList);
        return $this->fetch('edit');
    }
    public function edit()
    {
        $this->view->engine->layout(false);

        if(!input('?param.id')){
            return error_code(10000);
        }

        $manageModel = new ManageModel();
        if(input('param.id') == $manageModel::TYPE_SUPER_ID){
            return "超级管理员，就不要编辑了吧？";
        }
        $manageInfo = $manageModel->where(['id'=>input('param.id')])->find();
        if(!$manageInfo){
            return error_code(11004);
        }


        if(Request::isPost()){
            return $manageModel->toAdd(input('param.'));
        }

        $manageRoleModel = new ManageRole();
        $manageRoleList = $manageRoleModel->select();
        $manageRoleRelModel = new ManageRoleRel();
        $smList = $manageRoleRelModel->where(['manage_id'=>input('param.id')])->select();
        foreach($manageRoleList as $k => $v){
            $checked = false;
            foreach($smList as $i => $j){
                if($j['role_id'] == $v['id']){
                    $checked = true;
                    break;
                }
            }
            $manageRoleList[$k]['checked'] = $checked;
        }
        $this->assign('roleList',$manageRoleList);
        $this->assign('manageInfo',$manageInfo);
        return $this->fetch('edit');
    }
    public function del()
    {
        $result = [
            'status' => false,
            'data' => '',
            'msg' => ''
        ];
        if(!input('?param.id')){
            return error_code(10000);
        }

        $manageModel = new manageModel();

        if(input('param.id') == $manageModel::TYPE_SUPER_ID){
            $result['msg'] = "超级管理员，就不要删除了把？";
            return $result;
        }

        $where['id'] = input('param.id');
        $re = $manageModel->where($where)->delete();
        if($re){
            $result['status'] = true;
            $result['msg'] = '删除成功';
        }else{
            $result['msg'] = '删除失败，请重试';
        }


        return $result;

    }

    /**
     * 获取用户资料信息
     * @return mixed
     */
    public function information()
    {

        $manageModel = new ManageModel();
        $manageInfo = $manageModel->where(['id'=>session('manage.id')])->find();

        $this->assign('manage_info',$manageInfo);
        return $this->fetch();
    }


    /**
     * 用户修改/找回密码
     * @return array
     */
    public function editPwd()
    {
        $result = [
            'status' => false,
            'data' => '',
            'msg' => ''
        ];
        $manageModel = new ManageModel();

        if(!input('?param.newPwd') || !input('?param.password') || !input('?param.rePwd') ){
            $result['msg'] = "密码不能为空";
            return $result;
        }
        if(input('param.newPwd') != input('param.rePwd')){
            $result['msg'] = "两次密码不一致";
            return $result;
        }


        return $manageModel->chengePwd(session('manage.id'), input('param.password'), input('param.newPwd'));
    }

    /**
     * 获取查询授权信息
     * @return array
     */
    public function getVersion()
    {
        $return  = [
            'msg'    => '授权查询失败',
            'data'   => [],
            'status' => false,
        ];
        $product = config('jshop.product');
        $version = config('jshop.version');
        $url     = config('jshop.authorization_url') . '/b2c/Authorization/verification';
        $domain  = $_SERVER['SERVER_NAME'];
        $curl    = new Curl();
        $params  = [
            'domain'  => $domain,
            'product' => $product,
            'version' => $version,
            'time'    => time(),
        ];
        $data    = $curl::post($url, $params);
        $data =  json_decode($data,true);
        if ($data['status']) {//未授权
            $return['data']['is_authorization'] = $data['data']['is_authorization'];
            $return['data']['version']          = $version;
            $return['data']['product']          = $product;
            $return['data']['changeLog']        = $data['data']['changeLog'];
            $return['msg']                      = '授权查询成功';
            $return['status']                   = true;
            return $return;
        } else {
            $return['data']['product']          = $product;
            $return['data']['version']          = $version;
            $return['data']['changeLog']        = '未查询到授权信息';
            $return['data']['is_authorization'] = false;
            return $return;
        }
    }
}