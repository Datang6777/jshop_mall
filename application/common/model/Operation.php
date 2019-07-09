<?php
namespace app\common\model;

use think\facade\Hook;

class Operation extends Common
{
    const MENU_START = 1;       //起始节点
    const MENU_MANAGE = 2;      //管理平台起始菜单id

    const PERM_TYPE_SUB = 1;    //主体权限
    const PERM_TYPE_HALFSUB = 2;    //半主体权限，在权限菜单上提现，但是不在左侧菜单上体现
    const PERM_TYPE_REL  = 3;   //附加权限


    //不需要权限判断的控制器和方法,前台传过来的都是小写，这里就不采用驼峰法写了。
    private $noPerm = [
        self::MENU_MANAGE => [
            'Index'=> ['index','tagselectbrands','tagselectgoods','clearcache','welcome'],
            'Order' => ['statistics'],
            'Images' => ['uploadimage','listimage','manage','cropper'],
            'Files' => ['uploadVideo'],
            'User' => ['userloglist','statistics'],
            'MessageCenter' => ['message','messageview','messagedel'],
            'Promotion' => ['conditionlist','conditionadd','conditionedit','conditiondel','resultlist','resultadd','resultedit','resultdel'],
            'Worksheet'=>['worklist','sheetlist','sheetlist1','sheetlist2','sheetlist3','add','addwork','wsdetail','adddetail','updata','del','inquiries'],
            'Administrator' => ['information','editpwd','getversion'],
            'OperationLog' => ['getlastlog'],
            'Report' => ['getdatetype']
        ],
    ];



    /**
     * 返回导航信息..
     * @param $moduleName
     * @param $controllerName
     * @param $actionName
     * @return array
     */
    public function nav($moduleId, $controllerName, $actionName)
    {
        //取当前操作的控制器的信息，用于下面取当前操作数据
        $controllerInfo = $this->where(array('code'=>$controllerName, 'type'=>'c','parent_id'=>$moduleId))->find();
        if(!$controllerInfo){
            return [];
        }
        //取当前操作的数据
        $actionInfo = $this->where(array('code'=>$actionName, 'type'=>'a','parent_id'=>$controllerInfo['id']))->find();
        if(!$actionInfo){
            return [];
        }
        //判断是否是关联权限或者是半关联权限，如果是，就取他们的主体权限，这样才能在菜单上显示
        if($actionInfo['perm_type'] == self::PERM_TYPE_REL || $actionInfo['perm_type'] == self::PERM_TYPE_HALFSUB){
            //取关联记录,就不判断关联记录的权限类型了，顶多就是在分配的权限里找不到
            $ractionInfo = $this->where('id',$actionInfo['parent_menu_id'])->find();
            if(!$ractionInfo){
                return [];
            }
            //因为是关联或者半关联权限，所以去主体的父及祖父信息
            $data = $this->getNoteUrl($ractionInfo['parent_menu_id']);
            $the_data = $this->getNoteUrl($actionInfo['id'],false);
            if($the_data){
                $the_data['name'] = $ractionInfo['name']."(".$the_data['name'].")";
            }
            $data[] = $the_data;
            return $data;
        }else{
            //取当前节点及父和祖父信息
            return $this->getNoteUrl($actionInfo['id']);
        }
    }
    //递归取得节点以及父菜单节点的信息，用于在前台展示导航用..
    private function  getNoteUrl($id,$recursion = true)
    {
        $info = $this->where(['id'=>$id])->find();
        if(!$info){
            return false;
        }
        $data['name'] = $info['name'];
        $pinfo = $this->where(['id'=>$info['parent_id']])->find();
        switch($info['type']){
            case 'm':
                $data['url'] = url($info['code']."/index/index");
                break;
            case 'c':
                $data['url'] = url($info['code']."/index");
                break;
            case 'a':
                $data['url'] = "";
                break;
        }
        if($recursion){
            if($pinfo){
                $pdata = $this->getNoteUrl($info['parent_menu_id']);
            }
            $pdata[] = $data;
            return $pdata;
        }else{
            return $data;
        }

    }



    //递归取得所有的父节点
    public function getParents($operation_id){
        $data = [];
        $info = $this->where(['id' => $operation_id])->find();
        if(!$info){
            return $data;
        }
        //判断是否还有父节点，如果有，就取父节点，如果没有，就返回了
        if($info['parent_id'] !=self::MENU_START){
            $data = $this->getParents($info['parent_id']);      //返回空数组或者二维数组
        }
        array_push($data,$info->toArray());
        return $data;
    }

    /**
     * 返回管理端的菜单信息..
     * @param $parent_menu_id
     * @return array
     */
    public function manageMenu($manage_id, $controllerName="", $actionName="")
    {
        $parent_menu_id = self::MENU_MANAGE;

        //根据菜单取菜单on的样式
        $onMenu = [];//$this->getMenuNode($parent_menu_id, $controllerName, $actionName);       采用iframe架构后，不需要有菜单on的状态了，故此这里先注释掉。

        if(cache('?manage_operation_'.$manage_id)){
            $list = cache('manage_operation_'.$manage_id);
        }else{
            $manageModel = new Manage();
            $manageRoleRel = new ManageRoleRel();

            //如果是超级管理员，直接返回所有
            if($manage_id == $manageModel::TYPE_SUPER_ID){
                //直接取所有数据，然后返回
                $list = $this->where(['perm_type'=>self::PERM_TYPE_SUB])->order('sort asc')->select();
            }else{
                //取此管理员的所有角色
                $roles = $manageRoleRel->where('manage_id',$manage_id)->select();
                if(!$roles->isEmpty()){
                    $roles = $roles->toArray();
                    $roles = array_column($roles,'role_id');
                }else{
                    $roles = [];
                }
                //到这里就说明用户是店铺的普通管理员，那么就取所有的角色所对应的权限
                $list = $this
                    ->distinct(true)
                    ->field('o.*')
                    ->alias('o')
                    ->join(config('database.prefix').'manage_role_operation_rel mror', 'o.id = mror.operation_id')
                    ->where('mror.manage_role_id','IN',$roles)
                    ->where('o.perm_type',self::PERM_TYPE_SUB)
                    ->order('o.sort asc')
                    ->select();
            }
            if($list->isEmpty()){
                $list = [];     //啥权限都没有
            }else{
                $list = $list->toArray();
            }
            //存储
            cache('manage_operation_'.$manage_id,$list,3600);

        }

        $re = $this->createTree($list,$parent_menu_id,"parent_menu_id",$onMenu);        //构建菜单树
        //把插件的菜单也增加上去
        $this->addonsMenu($re);

        return  $re;
    }

    /**
     * 根据实际的控制器名称和方法名称，去算出在菜单上对应的控制器id和方法id..
     * @param $parent_menu_id
     * @param $controllerName
     * @param $actionName
     */
    public function getMenuNode($parent_menu_id, $controllerName, $actionName)
    {
        $data = [];
        //取当前操作的控制器的信息，用于下面取当前操作数据
        $controllerInfo = $this->where(array('code'=>$controllerName, 'type'=>'c','parent_id'=>$parent_menu_id))->find();
        if(!$controllerInfo){
            return $data;
        }
        //取当前操作的数据
        $actionInfo = $this->where(array('code'=>$actionName, 'type'=>'a','parent_id'=>$controllerInfo['id']))->find();
        if(!$actionInfo){
            return $data;
        }
        //判断是否是关联权限或者是半关联权限，如果是，就取他们的主体权限，这样才能在菜单上显示
        if($actionInfo['perm_type'] == self::PERM_TYPE_REL || $actionInfo['perm_type'] == self::PERM_TYPE_HALFSUB){
            //取关联记录,就不判断关联记录的权限类型了，顶多就是在分配的权限里找不到
            $actionInfo = $this->where('id',$actionInfo['parent_menu_id'])->find();
            if(!$actionInfo){
                return $data;
            }
        }
        //到这里，actionInfo就是实际的操作记录，如果此条记录是c（控制器），就直接返回，如果是a，就取它的c，然后返回俩，（为啥可能是c呢，因为关联权限可能指定到了一条控制器上面）
        if($actionInfo['type'] == 'c'){
            $data[$actionInfo['id']] = $actionInfo['id'];
        }else{
            if($actionInfo['type'] == 'a'){
                //先存起来，然后再去找他的c
                $data[$actionInfo['id']] = $actionInfo['id'];
                $cInfo = $this->where('id',$actionInfo['parent_menu_id'])->find();
                if($cInfo){
                    $data[$cInfo['id']] = $cInfo['id'];
                }
            }
        }
        return $data;
    }


    /**
     * 根据传过来的数组，构建以p_id为父节点的树..
     * @param $list 构建树所需要的节点，此值是根据权限节点算出来的
     * @param $parent_menu_id   构建树的根节点
     * @param $p_str        根据物理节点（parent_id）还是逻辑节点(parent_menu_id)来构建树,只能选择这两个值
     * @param array $onMenu 当前url的节点信息
     * @param array $allOperation   所有的节点树，外面不用传进来，里面会自动判断没有了，就全部取出来，方便生成各个节点的url
     * @return array
     */
    public function createTree($list,$parent_menu_id,$p_str,$onMenu=[],$allOperation=[])
    {
        $data = [];

        //判断所有节点的值是否有，没有了，全部取出来，省的一个一个的查
        if(!$allOperation){
            $allOperation = $this->select();
            if(!$allOperation->isEmpty()){
                $allOperation = $allOperation->toArray();
            }else{
                $allOperation = [];
            }
            $nallOperation = [];
            foreach($allOperation as $v){
                $nallOperation[$v['id']] = $v;
            }
            $allOperation = $nallOperation;
        }

        foreach($list as $k => $v){
            if($v[$p_str] == $parent_menu_id){
                $row = $v;
                //判断是否是选中状态
                if(isset($onMenu[$v['id']])){
                    $row['selected'] = true;
                }else{
                    $row['selected'] = false;
                }
                //取当前节点的url
                $row['url'] = $this->getUrl($v['id'],$allOperation);

                $row['children'] = $this->createTree($list,$v['id'],$p_str,$onMenu,$allOperation);

                $data[] = $row;
            }
        }

        return $data;
    }

    /**
     * 根据当前节点，取出当前节点的url，用于后台菜单节点的url生成
     * @param $operation_id
     * @param $list
     */
    private function getUrl($operation_id,$list){
        if(!isset($list[$operation_id])){
            return "";
        }
        if($list[$operation_id]['type'] == 'm'){
            return url($list[$operation_id]['code'] . '/index/index');          //一个模型，搞什么url？
        }
        if($list[$operation_id]['type'] == 'c'){
            if(isset($list[$list[$operation_id]['parent_id']])){
                return url($list[$list[$operation_id]['parent_id']]['code'] . '/'.$list[$operation_id]['code'].'/index');
            }else{
                return "";
            }
        }
        if($list[$operation_id]['type'] == 'a'){
            //取控制器
            if(isset($list[$list[$operation_id]['parent_id']]) && isset($list[$list[$list[$operation_id]['parent_id']]['parent_id']])){
                return url($list[$list[$list[$operation_id]['parent_id']]['parent_id']]['code'] . '/'.$list[$list[$operation_id]['parent_id']]['code'].'/'.$list[$operation_id]['code']);
            }else{
                return "";
            }
        }
        return "";

    }

//    /**
//     * 一对多关联菜单子项
//     * @return \think\model\relation\HasMany
//     */
//    public function menuChildren()
//    {
//        return $this->hasMany('Operation', 'parent_menu_id','id');
//    }

    public function parentInfo()
    {
        return $this->hasOne('Operation','id', 'parent_id')->bind([
            'parent_name' => 'name'
        ]);
    }
    public function parentMenuInfo()
    {
        return $this->hasOne('Operation','id', 'parent_menu_id')->bind([
            'parent_menu_name' => 'name'
        ]);
    }


    /**
     * 获取操作名称..
     * @param string $ctl           控制器编码
     * @param string $act           方法编码
     * @param int $model_id         模块的id，因为可能有不同的模块里的控制器和方法一样的情况
     * @return array
     */

    public function getOperationInfo($ctl = 'index', $act = 'index',$model_id = self::MENU_MANAGE)
    {
        $result        = [
            'msg'    => '',
            'data'   => '',
            'status' => false,
        ];
        $where['type'] = 'c';
        $where['code'] = $ctl;      //strtolower($ctl);
        $where['parent_id'] = $model_id;
        $ctlInfo       = $this->where($where)->find();
        if (!$ctlInfo) {
            return error_code(11088);
        }
        $where['type']      = 'a';
        $where['code']      = $act;     //strtolower($act);
        $where['parent_id'] = $ctlInfo['id'];
        $actInfo            = $this->where($where)->find();
        if (!$actInfo) {
            return error_code(11089);
        }
        $result['status'] = true;
        $result['data']   = [
            'ctl' => $ctlInfo,
            'act' => $actInfo,
        ];
        return $result;
    }

    /**
     * 递归取得节点下面的所有操作，按照菜单的展示来取
     * @param $pid
     * @param array $defaultNode   这些是默认选中的
     * @param int $level 层级深度
     * @return array
     */
    public function menuTree($pid, $defaultNode = [], $level = 1)
    {
        $area_tree = [];
        $where[]   = ['parent_menu_id', 'eq', $pid];
        $where[]   = ['perm_type', 'neq', self::PERM_TYPE_REL];     //不是附属权限的查出来就可以
        $list      = $this->where($where)->order('sort asc')->select()->toArray();

        foreach ($list as $key => $val) {
            $isChecked = '0';
            //判断是否选中的数据
            if ($defaultNode[$val['id']]) {
                $isChecked = '1';
            }
            $isLast = false;
            unset($where);
            $where[]   = ['parent_menu_id', 'eq', $val['id']];
            $where[]   = ['perm_type', 'neq', self::PERM_TYPE_REL];     //不是附属权限的查出来就可以
            $chid   = $this->where($where)->count();
            if (!$chid) {
                $isLast = true;
            }
            $area_tree[$key] = [
                'id'       => $val['id'],
                'title'    => $val['name'],
                'isLast'   => $isLast,
                'level'    => $level,
                'parentId' => $val['parent_id'],
                "checkArr" => [
                    'type'      => '0',
                    'isChecked' => $isChecked,
                ]
            ];
            if ($chid) {
                $level                       = $level + 1;
                $area_tree[$key]['children'] = $this->menuTree($val['id'], $defaultNode, $level);
            }
        }
        return $area_tree;
    }

    /**
     * 判断控制器和方法是否不需要校验
     * @param $p_id
     * @param $cont_name
     * @param $act_name
     * @return bool
     */
    public function checkNeedPerm($p_id,$cont_name,$act_name)
    {
        if(isset($this->noPerm[$p_id][$cont_name])){
            if(in_array($act_name,$this->noPerm[$p_id][$cont_name])){
                return true;
            }
        }
        return false;
    }
    /**
     * 返回layui的table所需要的格式
     * @author sin
     * @param $post
     * @return mixed
     */
    public function tableData($post)
    {
        if(isset($post['limit'])){
            $limit = $post['limit'];
        }else{
            $limit = config('paginate.list_rows');
        }
        $tableWhere = $this->tableWhere($post);
        $list = $this::with('parentInfo,parentMenuInfo')->field($tableWhere['field'])->where($tableWhere['where'])->order($tableWhere['order'])->paginate($limit);
        $data = $this->tableFormat($list->getCollection());         //返回的数据格式化，并渲染成table所需要的最终的显示数据类型

        $re['code'] = 0;
        $re['msg'] = '';
        $re['count'] = $list->total();
        $re['data'] = $data;
        //取所有的父节点，构建路径
        if(isset($post['parent_id'])){
            $re['parents'] = $this->getParents($post['parent_id']);
        }else{
            $re['parents'] = [];
        }

        $re['sql'] = $this->getLastSql();

        return $re;
    }

    /**
     * 根据输入的查询条件，返回所需要的where
     * @author sin
     * @param $post
     * @return mixed
     */
    protected function tableWhere($post)
    {
        $where = [];
        if(isset($post['parent_id']) && $post['parent_id'] != ""){
            $where[] = ['parent_id', 'eq', $post['parent_id']];
        }


        $result['where'] = $where;
        $result['field'] = "*";
        $result['order'] = [];
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
        foreach($list as $k => $v){
            if(isset($v['type'])){
                $list[$k]['type'] = config('params.operation.type')[$v['type']];
            }
            if(isset($v['perm_type']) && isset($v['parent_menu_id'])){
                if($v['parent_menu_id'] != '0'){
                    $list[$k]['perm_type'] = config('params.operation.perm_type')[$v['perm_type']];
                }else{
                    $list[$k]['perm_type'] = "";
                }
            }

        }
        return $list;
    }

    /**
     * 删除操作
     * @param $id
     */
    public function toDel($id)
    {
        $status = [
            'status' => false,
            'data' => '',
            'msg' => ''
        ];
        //如果没有下级了，就可以删了
        $children = $this->where(['parent_id'=>$id])->select();
        if($children->isEmpty()){
            $re = $this->where(['id'=>$id])->delete();
            if($re){
                $status['status'] = true;
            }else{
                $status['msg'] = "删除失败";
            }
            return $status;
        }else{
            return error_code(11091);
        }
    }

    public function toAdd($data){
        $status = [
            'status' => false,
            'data' => '',
            'msg' => ''
        ];
        if(!isset($data['id']) || !isset($data['parent_id']) || !isset($data['name']) || !isset($data['code']) || !isset($data['type']) || !isset($data['perm_type'])){
            return error_code(11092);
        }
        //如果是方法，code换成小写
        if($data['type'] == 'a'){
            $data['code'] = strtolower($data['code']);
        }

        //校验父节点和当前类型
        if($data['parent_id'] != self::MENU_START){
            //判断是否是合法的父节点,既然是父节点，肯定不可能是方法，因为方法不可能成为父节点
            $parentInfo = $this->where('type','neq','a')->where('id','eq',$data['parent_id'])->find();
            if(!$parentInfo){
                return error_code(10000);
            }
            //有父节点了，那么就得判断当前的类型和父类型是否对应上
            if($parentInfo['type'] == 'm'){
                if($data['type'] != 'c'){
                    return error_code(11093);
                }
            }
            if($parentInfo['type'] == 'c'){
                if($data['type'] != 'a'){
                    return error_code(11094);
                }
            }

        }else{
            if($data['type'] != 'm'){
                return error_code(11095);
            }
        }
        //判断当前编码是否重复
        $where[] = ['parent_id','eq',$data['parent_id']];
        $where[] = ['code','eq',$data['code']];
        if($data['id'] != ""){
            $where[] = ['id','neq',$data['id']];
        }
        $info = $this->where($where)->find();
        if($info){
            return error_code(11096);
        }

        //判断父菜单节点是否存在
        if($data['parent_menu_id'] != self::MENU_START){
            $menuParentInfo = $this->where('id','eq',$data['parent_menu_id'])->find();
            if(!$menuParentInfo){
                return error_code(10000);
            }
            //如果是控制器，父菜单节点必须和父节点保持一致，
            if($data['type'] == 'c' && ($data['parent_id'] != $data['parent_menu_id'])){
                return error_code(11099);
            }
        }

        if($data['id'] != ""){
            //当前是修改，就需要判断是否会陷入死循环
            if(!$this->checkDie($data['id'],$data['parent_id'],'parent_id')){
                return error_code(11097);
            }
            if(!$this->checkDie($data['id'],$data['parent_menu_id'],'parent_menu_id')){
                return error_code(11098);
            }
            $id = $data['id'];
            unset($data['id']);
            $re = $this->save($data,['id'=>$id]);
        }else{
            $re = $this->save($data);
        }


        if($re){
            $status['status'] = true;
        }
        return $status;

    }

    /**
     * 预先判断死循环
     * @param $id       当前id
     * @param $p_id     预挂载的父id
     * @param $p_str    父节点类型 parent_id  或者是 parent_menu_id
     * @param int $n    循环次数
     * @return bool     如果为true就是通过了，否则就是未通过
     */
    private function checkDie($id,$p_id,$p_str,$n=10)
    {
        //设置计数器，防止极端情况下陷入死循环了（其他地方如果设置的有问题死循环的话，这里就报错了）
        if($n <= 0){
            return false;
        }
        if($id == $p_id){
            return false;
        }
        if($id == self::MENU_START || $p_id == self::MENU_START){
            return true;
        }
        $pinfo = $this->where(['id'=>$p_id])->find();
        if(!$pinfo){
            return false;
        }
        if($pinfo[$p_str] == self::MENU_START){
            return true;
        }
        if($pinfo[$p_str] == $id){
            return false;
        }
        return $this->checkDie($id,$pinfo[$p_str],$p_str,--$n);
    }

    //通过钩子，把插件里的菜单都吸出来，然后增加到树上
    private function addonsMenu(&$tree){
        $list = hook('menu', []);
        if($list){
            foreach($list as $v){
                if($v){
                    $this->addonsMenuAdd($v,$tree);
                }
            }
        }
    }
    //把某一个插件的菜单加到树上
    private function addonsMenuAdd($conf,&$tree){
        foreach($conf as $v){
            $this->addonsMenuAdd2($v,$tree);
        }
    }
    //把某一个插件的某一个菜单节点加到树上
    private function addonsMenuAdd2($opt,&$tree){
        //查找树
        if($opt['parent_menu_id'] != '0'){
            foreach($tree as &$v){
                if($v['id'] == $opt['parent_menu_id']){
                    //todo
                    if(!isset($v['children'])){
                        $v['children'] = [];
                    }
                    $this->addonsMenuAdd3($opt,$v['children']);
                    return true;
                }
                //查看他的孩子是否有
                if(isset($v['children']) && $this->addonsMenuAdd2($opt,$v['children'])){
                    return true;        //如果找到了，就不要空跑了。
                }
            }
        }else{
            //插入到一级菜单上，图标就需要自定义了，而且$opt里必须得有code字段
            $this->addonsMenuAdd3($opt,$tree);
        }
        return false;
    }

    //把一个插件的菜单加到这个节点的孩子列表里
    private function addonsMenuAdd3($opt,&$tree){
        if(!empty($tree)){
            foreach($tree as $k => $v){
                if($v['sort'] > $opt['sort']){
                    //插入到当前位置
                    array_splice($tree,$k,0,[$opt]);
                    return true;
                }
            }
            //能走到这里，插入到最后
            $tree[] = $opt;
        }else{
            $tree[] = $opt;
            return true;
        }
        return false;
    }

}
