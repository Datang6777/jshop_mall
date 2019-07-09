<?php
namespace app\common\model;
use think\model\concern\SoftDelete;

/**
 * Class Clerk
 * @package app\common\model
 */
class Clerk extends Common
{
    protected $autoWriteTimestamp = true;
    protected $createTime = 'ctime';
    protected $updateTime = 'utime';

    use SoftDelete;
    protected $deleteTime = 'isdel';


    /**
     * 获取店员详情
     * @param $id
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function getInfo($id)
    {
        $return = [
            'status' => false,
            'msg' => '获取失败',
            'data' => []
        ];
        $where[] = ['id', 'eq', $id];
        $return['data'] = $this->where($where)->find();
        if($return['data'] !== false)
        {
            $userModel = new User();
            $return['data']['user_mobile'] = $userModel->getUserMobile($return['data']['user_id']);
            $return['status'] = true;
            $return['msg'] = '获取成功';
        }
        return $return;
    }


    /**
     * 获取店员列表
     * @param bool $id
     * @param int $page
     * @param int $limit
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function getList($id = false, $page = 1, $limit = 20)
    {
        $return = [
            'status' => false,
            'msg' => '获取失败',
            'data' => [],
            'count' => 0
        ];

        $where = [];
        if($id)
        {
            $where[] = ['store_id', 'eq', $id];
        }

        $return['data'] = $this->where($where)
            ->page($page, $limit)
            ->order('ctime desc')
            ->select();

        $return['count'] = $this->where($where)
            ->count();

        if($return['data'] !== false)
        {
            $storeModel = new Store();
            $userModel = new User();
            foreach($return['data'] as $k => $v)
            {
                $v['store_name'] = $storeModel->getStoreName($v['store_id']);
                $v['user_nickname'] = $userModel->getUserNickname($v['user_id']);
                $v['user_mobile'] = $userModel->getUserMobile($v['user_id']);
                $v['ctime'] = getTime($v['ctime']);
            }
            $return['status'] = true;
            $return['msg'] = '获取成功';
        }

        return $return;
    }


    /**
     * 添加店员
     * @param $store_id
     * @param $user_mobile
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function add($store_id, $user_mobile)
    {
        $return = [
            'status' => false,
            'msg' => '添加失败',
            'data' => ''
        ];

        $userModel = new User();
        $user_id = $userModel->getUserIdByMobile($user_mobile);
        if(!$user_id)
        {
            $return['msg'] = '这个手机号没有对应的店铺用户';
            return $return;
        }

        $storeModel = new Store();
        $store_flag = $storeModel->storeExist($store_id);
        if(!$store_flag)
        {
            $return['msg'] = '这个店铺不存在';
            return $return;
        }

        $where[] = ['store_id', 'eq', $store_id];
        $where[] = ['user_id', 'eq', $user_id];
        $flag = $this->where($where)->find();
        if($flag)
        {
            $return['msg'] = '已经存在这个店员，无需重复添加';
            return $return;
        }

        $data['store_id'] = $store_id;
        $data['user_id'] = $user_id;
        $return['data'] = $this->save($data);

        if($return['data'] !== false)
        {
            $return['status'] = true;
            $return['msg'] = '添加成功';
        }

        return $return;
    }


    /**
     * 删除店员
     * @param $id
     * @return array
     */
    public function del($id)
    {
        $return = [
            'status' => false,
            'msg' => '删除失败',
            'data' => ''
        ];
        $return['data'] = $this->destroy($id);
        if($return['data'] !== false)
        {
            $return['status'] = true;
            $return['msg'] = '删除成功';
        }
        return $return;
    }


    /**
     * 判断是不是店员
     * @param $user_id
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function isClerk($user_id)
    {
        $return = [
            'status' => false,
            'msg' => '不是店员',
            'data' => [],
            'flag' => false,
        ];

        $settingModel = new Setting();
        $switch = $settingModel->getValue('store_switch');
        if($switch == 1)
        {
            $return['status'] = true;
            $where[] = ['user_id', 'eq', $user_id];
            $return['data'] = $this->where($where)->find();
            if($return['data'])
            {
                $return['msg'] = '是店员';
                $return['flag'] = true;
            }
        }
        else
        {
            $return['status'] = true;
            $return['msg'] = '未开启到店自提';
        }

        return $return;
    }


    /**
     * 获取店员所属店铺ID
     * @param $user_id
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function getClerkStoreIds($user_id)
    {
        $where[] = ['user_id', 'eq', $user_id];
        $ids = $this->field('store_id')
            ->where($where)
            ->select();
        $newData = [];
        foreach($ids as $k => $v)
        {
            $newData[] = $v['store_id'];
        }
        return $newData;
    }


    /**
     * 获取店员名称
     * @param $id
     * @return mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    public function getClerkName($id)
    {
        $where[] = ['id', 'eq', $id];
        $info = $this->field('user_id')->where($where)->find();
        $userModel = new User();
        $whereu[] = ['id', 'eq', $info['user_id']];
        $data = $userModel->field('mobile,nickname')->where($whereu)->find();
        return $data['nickname']?$data['nickname']:$data['mobile'];
    }
}