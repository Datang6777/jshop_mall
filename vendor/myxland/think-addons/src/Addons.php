<?php
namespace myxland\addons;

use think\Db;
use think\Controller;
/**
 * 插件基类
 * Class Addons
 *
 * @package myxland\addons
 */
abstract class Addons extends Controller
{

    // 当前错误信息
    protected $error;

    /**
     * $info = [
     *  'name'          => 'Test',
     *  'title'         => '测试插件',
     *  'description'   => '用于thinkphp5的插件扩展演示',
     *  'status'        => 1,
     *  'author'        => 'byron sampson',
     *  'version'       => '0.1'
     * ]
     */
    public $info = [];

    public $addons_path = '';

    public $config_file = '';

    /**
     * 架构函数
     *
     * @access public
     */
    public function __construct()
    {
        // 获取当前插件目录
        $this->addons_path = ADDON_PATH . $this->getName() . DIRECTORY_SEPARATOR;
        // 读取当前插件配置信息
        if (is_file($this->addons_path . 'config.php')) {
            $this->config_file = $this->addons_path . 'config.php';
        }
        // 控制器初始化
        parent::__construct();
    }

    /**
     * 获取插件的配置数组
     *
     * @param string $name 可选模块名
     * @return array|mixed|null
     */
    final public function getConfig($name = '')
    {
        static $_config = [];
        if (empty($name)) {
            $name = $this->getName();
        }
        if (isset($_config[$name])) {
            return $_config[$name];
        }
        $map['name']   = $name;
        $map['status'] = 1;
        $config        = [];

        if (is_file($this->config_file)) {
            $temp_arr = include $this->config_file;

            foreach ($temp_arr as $key => $value) {
                if (isset($value['type']) && $value['type'] == 'group') {
                    foreach ($value['options'] as $gkey => $gvalue) {
                        foreach ($gvalue['options'] as $ikey => $ivalue) {
                            $config[$ikey] = $ivalue['value'];
                        }
                    }
                } else {
                    $config[$key] = $temp_arr[$key]['value'];
                }
            }
            unset($temp_arr);
        }
        $_config[$name] = $config;

        return $config;
    }

    /**
     * 获取当前模块名
     *
     * @return string
     */
    final public function getName()
    {
        $data = explode('\\', get_class($this));
        $class_name = array_pop($data);
        return array_pop($data);
    }

    /**
     * 检查配置信息是否完整
     *
     * @return bool
     */
    final public function checkInfo()
    {
        $info_check_keys = ['name', 'title', 'description', 'status', 'author', 'version'];
        foreach ($info_check_keys as $value) {
            if (!array_key_exists($value, $this->info)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 加载模板和页面输出 可以返回输出内容
     *
     * @access public
     * @param string $template 模板文件名或者内容
     * @param array $vars 模板输出变量
     * @param array $replace 替换内容
     * @param array $config 模板参数
     * @return mixed
     * @throws \Exception
     */
    protected function fetch($template = '', $vars = [], $replace = [], $config = [])
    {
        if (!is_file($template)) {
            $template = '/' . $template;
        }
        // 关闭模板布局
        $this->view->engine->layout(false);
        $this->view->engine(['view_path'=>  $this->addons_path]);
        return parent::fetch($template, $vars, $replace, $config);
    }



    /**
     * 模板变量赋值
     *
     * @access protected
     * @param mixed $name 要显示的模板变量
     * @param mixed $value 变量的值
     * @return void
     */
    protected function assign($name, $value = '')
    {
       return parent::assign($name, $value);
    }

    /**
     * 获取当前错误信息
     *
     * @return mixed
     */
    public function getError()
    {
        return $this->error;
    }

    //必须实现安装
    abstract public function install();

    //必须卸载插件方法
    abstract public function uninstall();

    //必须实现配置函数
    abstract public function config();

    //获取弹窗配置
    public function getDialog()
    {
        $info = $this->info;
        $dialog['width'] = $info['dialog_width']?$info['dialog_width']:'600px';
        $dialog['height'] = $info['dialog_height']?$info['dialog_height']:'520px';
        return $dialog;
    }

    /**
     * 显示错误信息
     * @param $msg
     */
    public function showError($msg){
        header("Content-type: text/html; charset=utf-8");
        echo $msg;return;
    }

}
