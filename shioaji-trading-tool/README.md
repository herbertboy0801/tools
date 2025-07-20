# Shioaji 股票交易工具

本项目旨在使用 Shioaji API 开发一个股票交易工具。

## 开发日志

### 2025-06-15
*   尝试使用 `pip install shioaji` 安装 Shioaji 库，但遇到错误：
    ```
    ERROR: Could not find a version that satisfies the requirement shioaji (from versions: none)
    ERROR: No matching distribution found for shioaji
    ```
    后续将尝试解决此安装问题。
*   尝试使用 `pip install -i https://pypi.org/simple/ shioaji` 指定官方 PyPI 源安装，仍然遇到相同错误：
    ```
    ERROR: Could not find a version that satisfies the requirement shioaji (from versions: none)
    ERROR: No matching distribution found for shioaji
    ```
*   用户报告 Python 版本为 `3.13.4`。这可能是一个较新的版本，`shioaji` 可能尚未提供对此版本的兼容包。
*   根据用户在 GitHub 仓库的调研，`shioaji` API 似乎仅支持到 Python 3.11 版本。这解释了在 Python 3.13.4 环境下安装失败的原因。
*   用户成功安装了 Python 3.11.6。
*   在项目目录 `shioaji-trading-tool` 下创建了名为 `.venv` 的 Python 3.11 虚拟环境，并成功激活。
*   在激活的虚拟环境中，使用 `pip install shioaji` 命令成功安装了 `shioaji` (版本 1.2.5) 及其依赖。环境配置初步完成！
*   修改 `main.py` 以从控制台动态获取用户凭证。
*   用户成功运行 `main.py`，脚本成功连接 Shioaji API、登录并激活 CA 证书。用户认证模块核心功能验证通过。
*   通过探查 `main.py` 中 `api` 对象的 `dir()` 输出，发现了潜在的查询账户信息的方法：`api.account_balance()` 和 `api.list_positions()`。
*   `main.py` 成功调用 `api.account_balance()` 和 `api.list_positions(api.stock_account)`。
    *   `api.account_balance()` 返回一个包含 `acc_balance` (浮点数)、`date` (日期时间字符串) 和 `status` 等属性的对象。
    *   `api.list_positions(api.stock_account)` 返回一个包含多个持仓对象的列表，每个对象包含 `id`, `code` (股票代码字符串), `direction` (买卖方向), `quantity` (整数), `price` (成本价格浮点数), `last_price` (最新价格浮点数), `pnl` (盈亏浮点数), `yd_quantity` (昨日数量) 等属性。
    *   账户信息模块的核心功能（查询余额和持仓）已通过API成功验证，并且能在 `main.py` 中以格式化形式正确输出。

### 2025-06-16
*   用户选择使用 Tkinter 和 CustomTkinter 作为GUI库。
*   成功安装 `customtkinter` 库。
*   创建了 `gui.py` 作为GUI主文件，并创建了 `api_handler.py` 用于封装Shioaji API的交互逻辑。
*   在 `gui.py` 中实现了基本的登录界面，包括凭证输入框和登录按钮。
*   `api_handler.py` 中封装了登录、CA激活、查询余额和查询持仓的方法。
*   GUI能够成功调用API Handler进行登录和数据获取，并将账户余额和持仓信息正确显示在界面上。解决了 `ModuleNotFoundError` 问题，确保了脚本在正确的虚拟环境解释器下运行。
*   初步的GUI界面和核心数据显示功能完成。
*   实现了刷新账户信息的功能按钮。
*   实现了API凭证的本地保存与加载功能 (`config.json`)，用户下次启动时会自动填充除CA密码外的凭证，提高了易用性。
*   **实时行情 (Market Data) - 基础功能**:
    *   **GUI (`gui.py`)**:
        *   添加了新的 "实时行情订阅" UI区域 (`create_quote_frame`):
            *   输入框用于输入股票代码。
            *   下拉菜单选择行情类型 (tick, bidask, both)。
            *   "订阅行情" 和 "取消订阅" 按钮。
            *   文本框用于显示接收到的行情数据。
        *   实现了 `_handle_subscribe_quote` 和 `_handle_unsubscribe_quote` 方法，用于处理按钮点击事件，调用 `api_handler.py` 中的订阅/取消订阅功能，并更新状态栏和显示消息框。
        *   实现了 `_gui_handle_tick_data` 和 `_gui_handle_bidask_data` 方法，作为从 `api_handler.py` 接收已处理行情数据的回调。这些方法会将数据格式化并显示在行情数据文本框中，使用 `self.after(0, ...)` 保证线程安全。
        *   在 `TradingApp.__init__` 中注册了上述GUI回调到 `api_client` 实例。
        *   在 `handle_login` 方法中，于成功登录后启用行情订阅相关的UI组件。
    *   **API处理器 (`api_handler.py`)**:
        *   (已在先前步骤中完成) 添加了 `subscribe_stock_quote` 和 `unsubscribe_stock_quote` 方法。
        *   (已在先前步骤中完成) 设置了内部Shioaji回调 (`api.quote.on_tick_stk_v1`, `api.quote.on_bidask_stk_v1`) 来接收原始行情数据。
        *   (已在先前步骤中完成) 内部回调会将原始数据处理成字典格式，然后调用注册的GUI回调函数。