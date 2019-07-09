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
use Request;
use app\common\model\GoodsType as typeModel;
use app\common\model\GoodsTypeSpec as typeSpecModel;
use app\common\model\GoodsTypeSpecValue;

/**
 * 商品类型属性
 * Class GoodsTypeSpec
 * @package app\Manage\controller
 * User: wjima
 * Email:1457529125@qq.com
 * Date: 2018-01-09 20:07
 */
class GoodsTypeSpec extends Manage
{

    /**
     * 商品类型列表
     * @return mixed
     */
    public function index()
    {
        if (Request::isAjax()) {
            $typeSpecModel       = new typeSpecModel();
            $filter              = input('request.');
            return $typeSpecModel->tableData($filter);
        }
        return $this->fetch('index');
    }

    /**
     * 添加类型
     * User: wjima
     * Email:1457529125@qq.com
     * Date: 2018-01-09 20:47
     */
    public function add()
    {
        $this->view->engine->layout(false);
        if (!Request::instance()->isPost()) {
            //获取添加页面
            return $this->fetch('add');
        } else {

            $specModel = new typeSpecModel();

            $specModel::startTrans();
            $name  = input('name');
            $sort  = input('sort');
            $value = input('value/a');

            $spec = [
                'name'      => $name,
                'sort'      => $sort
            ];

            $result = $specModel->add($spec);
            if ($result !== false) {
                //保存属性值
                $specId = $specModel->getLastInsID();
                foreach ((array)$value as $key => $val) {
                    $specValue[] = [
                        'spec_id' => $specId,
                        'value'   => $val,
                    ];
                }
                $specValueModel = new GoodsTypeSpecValue();
                $result         = $specValueModel->addAll($specValue);
                if ($result) {
                    $specModel::commit();
                    $return_data = [
                        'status' => true,
                        'msg'    => '添加成功',
                        'data'   => $result,
                    ];
                } else {
                    $specModel::rollback();
                    $return_data = [
                        'status' => false,
                        'msg'    => '添加失败',
                        'data'   => $result,
                    ];
                }
            } else {
                $specModel::rollback();
                $return_data = [
                    'status' => false,
                    'msg'    => '添加失败',
                    'data'   => $result,
                ];
            }
            return $return_data;
        }
    }

    /**
     * 编辑属性
     * @return array|mixed
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function edit()
    {
        $this->view->engine->layout(false);
        $id                = input('request.id/d');
        $goodsTypeModel    = new typeSpecModel();
        $filter            = [
            'id'        => $id,
        ];
        $typeSpec          = $goodsTypeModel::get($filter);
        $specValueModel    = new GoodsTypeSpecValue();
        $typeSpec['value'] = $specValueModel::all(['spec_id' => $id]);

        $this->assign('typeSpec', $typeSpec);
        if (Request::isPost()) {
            $result         = [
                'status' => false,
                'msg'    => '保存失败',
                'data'   => '',
            ];
            $goodsTypeModel = new typeSpecModel();
            $specValueModel = new GoodsTypeSpecValue();
            $data           = [
                'id'        => $id,
                'name'      => input('post.name', ''),
                'sort'      => input('post.sort', 100)
            ];
            $value          = input('post.value/a', []);
            if (!$value) {
                $result['msg'] = '属性值不能为空';
                return $result;
            }
            $goodsTypeModel->startTrans();
            if ($specValueModel::get(['spec_id' => $data['id']])) {
                if (!$specValueModel::destroy(['spec_id' => $data['id']])) {
                    $goodsTypeModel->rollback();
                    $result['msg'] = '属性值删除失败';
                    return $result;
                }
            }
            $goodsTypeModel::update($data, $filter);
            $valueData = [];
            foreach ((array)$value as $key => $val) {
                $valueData[] = [
                    'spec_id' => $data['id'],
                    'value'   => $val,
                    'sort'    => $data['sort'] ? $data['sort'] : 100,
                ];
            }
            if (!$specValueModel->saveAll($valueData)) {
                $goodsTypeModel->rollback();
                $result['msg'] = '属性值保存失败';
                return $result;
            }
            $goodsTypeModel->commit();
            $result = [
                'status' => true,
                'msg'    => '保存成功',
                'data'   => '',
            ];
            return $result;
        }
        return $this->fetch('edit');
    }

    /**
     * 删除属性以及属性值
     * todo 是否关联判断存在类型调用
     * User:wjima
     * Email:1457529125@qq.com
     * @return array
     */
    public function del()
    {
        $result = [
            'status' => false,
            'msg'    => '删除失败',
            'data'   => '',
        ];
        $id     = input('post.id', 0);
        if ($id) {
            $goodsTypeModel = new typeSpecModel();
            $goodsTypeModel->startTrans();
            $filter            = [
                'id'        => $id,
            ];
            if ($goodsTypeModel::destroy($filter)) {
                $specValueModel = new GoodsTypeSpecValue();
                if (!$specValueModel::get(['spec_id' => $id])) {
                    $goodsTypeModel->commit();
                    $result['status'] = true;
                    $result['msg']    = '删除成功';
                    return $result;
                }

                if ($specValueModel::destroy(['spec_id' => $id])) {
                    $result['status'] = true;
                    $result['msg']    = '删除成功';
                    $goodsTypeModel->commit();
                } else {
                    $goodsTypeModel->rollback();
                }
            }
        }

        return $result;
    }



    /**
     * 弹窗属性列表
     */
    public function getlist(){
        $this->view->engine->layout(false);
        return $this->fetch('getlist');
    }
}
