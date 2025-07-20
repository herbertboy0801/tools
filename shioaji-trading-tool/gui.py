import customtkinter as ctk
from api_handler import ShioajiApiClient
import tkinter.messagebox as messagebox
import json # 用于保存和加载配置
import os   # 用于检查文件是否存在

CONFIG_FILE = "config.json"

class TradingApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Shioaji 股票交易工具")
        self.geometry("800x700") # 稍微调大一点以容纳更多组件

        ctk.set_appearance_mode("System")
        ctk.set_default_color_theme("blue")

        self.api_client = ShioajiApiClient() # 创建API客户端实例

        # --- UI 组件 ---
        self.create_login_frame()
        self.create_action_buttons_frame()
        self.create_trading_frame()
        self.create_quote_frame() # 新增：行情框架
        self.create_info_display_frame()
        self.create_status_frame()

        self.load_credentials_from_config() # 启动时加载凭证
        
        # 注册API客户端的回调
        self.api_client.set_gui_tick_callback(self._gui_handle_tick_data)
        self.api_client.set_gui_bidask_callback(self._gui_handle_bidask_data)

    def create_login_frame(self):
        self.login_frame = ctk.CTkFrame(self, corner_radius=10)
        self.login_frame.pack(pady=20, padx=20, fill="x")

        ctk.CTkLabel(self.login_frame, text="API 凭证登录", font=ctk.CTkFont(size=16, weight="bold")).grid(row=0, column=0, columnspan=2, pady=10)

        # 输入字段
        labels_texts = ["API Token:", "API Secret Key:", "CA Path:", "CA Password:", "Person ID:"]
        self.entries = {}

        for i, text in enumerate(labels_texts):
            label = ctk.CTkLabel(self.login_frame, text=text)
            label.grid(row=i+1, column=0, padx=10, pady=5, sticky="w")
            
            entry_var = ctk.StringVar()
            # 对密码字段使用 show="*"
            show_char = "*" if "Key" in text or "Password" in text else ""
            entry = ctk.CTkEntry(self.login_frame, textvariable=entry_var, width=300, show=show_char)
            entry.grid(row=i+1, column=1, padx=10, pady=5, sticky="ew")
            self.entries[text.split(":")[0].replace(" ", "_").lower()] = entry_var
        
        # 登录按钮
        self.login_button = ctk.CTkButton(self.login_frame, text="登录并激活CA", command=self.handle_login)
        self.login_button.grid(row=len(labels_texts)+1, column=0, columnspan=2, pady=15)

    def create_status_frame(self):
        self.status_frame = ctk.CTkFrame(self, corner_radius=0)
        self.status_frame.pack(fill="x", side="bottom")
        self.status_label = ctk.CTkLabel(self.status_frame, text="状态: 未登录", anchor="w")
        self.status_label.pack(pady=5, padx=10, fill="x")

    def create_action_buttons_frame(self):
        self.action_frame = ctk.CTkFrame(self, corner_radius=0)
        self.action_frame.pack(pady=5, padx=20, fill="x")

        self.refresh_button = ctk.CTkButton(
            self.action_frame,
            text="刷新账户信息",
            command=self.fetch_and_display_account_info,
            state="disabled" # 初始禁用
        )
        self.refresh_button.pack(side="left", padx=5)
        # 可以添加更多按钮，例如登出按钮

    def create_info_display_frame(self):
        # 这个框架将用于显示账户余额和持仓信息
        self.info_frame = ctk.CTkFrame(self, corner_radius=10)
        self.info_frame.pack(pady=10, padx=20, fill="both", expand=True)
        # 初始占位符，将在 fetch_and_display_account_info 中被清除和填充
        self.initial_info_label = ctk.CTkLabel(self.info_frame, text="登录后将在此显示账户信息")
        self.initial_info_label.pack(pady=20, padx=20)

    def create_trading_frame(self):
        self.trading_frame = ctk.CTkFrame(self, corner_radius=10)
        self.trading_frame.pack(pady=10, padx=20, fill="x")

        ctk.CTkLabel(self.trading_frame, text="交易下单", font=ctk.CTkFont(size=16, weight="bold")).grid(row=0, column=0, columnspan=4, pady=10)

        # 股票代码
        ctk.CTkLabel(self.trading_frame, text="股票代码:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.stock_code_entry = ctk.CTkEntry(self.trading_frame, placeholder_text="例如 2330", state="disabled")
        self.stock_code_entry.grid(row=1, column=1, padx=5, pady=5, sticky="ew")

        # 买卖方向
        ctk.CTkLabel(self.trading_frame, text="操作:").grid(row=1, column=2, padx=5, pady=5, sticky="w")
        self.action_var = ctk.StringVar(value="Buy") # 默认买入
        self.action_menu = ctk.CTkOptionMenu(self.trading_frame, variable=self.action_var, values=["Buy", "Sell"], state="disabled")
        self.action_menu.grid(row=1, column=3, padx=5, pady=5, sticky="ew")
        
        # 价格
        ctk.CTkLabel(self.trading_frame, text="价格:").grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.price_entry = ctk.CTkEntry(self.trading_frame, placeholder_text="例如 100.5", state="disabled")
        self.price_entry.grid(row=2, column=1, padx=5, pady=5, sticky="ew")

        # 数量 (股)
        ctk.CTkLabel(self.trading_frame, text="数量(股):").grid(row=2, column=2, padx=5, pady=5, sticky="w")
        self.quantity_entry = ctk.CTkEntry(self.trading_frame, placeholder_text="例如 1000", state="disabled")
        self.quantity_entry.grid(row=2, column=3, padx=5, pady=5, sticky="ew")

        # 订单类型 (OrderType: ROD, IOC, FOK)
        ctk.CTkLabel(self.trading_frame, text="订单类型:").grid(row=3, column=0, padx=5, pady=5, sticky="w")
        self.order_type_var = ctk.StringVar(value="ROD") # 默认ROD
        self.order_type_menu = ctk.CTkOptionMenu(
            self.trading_frame, variable=self.order_type_var,
            values=["ROD", "IOC", "FOK"], state="disabled"
            # Shioaji API 中 sj.OrderType.ROD, sj.OrderType.IOC, sj.OrderType.FOK
        )
        self.order_type_menu.grid(row=3, column=1, padx=5, pady=5, sticky="ew")
        
        # 价格类型 (PriceType: LMT, MKT (市价通常配合IOC/FOK))
        # 对于初版，我们先简化，假设价格框输入的是限价，如果价格为空或0，再考虑是否转为市价逻辑（需API支持）
        # 或者添加一个明确的 PriceType 选择
        ctk.CTkLabel(self.trading_frame, text="价格类型:").grid(row=3, column=2, padx=5, pady=5, sticky="w")
        self.price_type_var = ctk.StringVar(value="LMT") # 默认LMT
        self.price_type_menu = ctk.CTkOptionMenu(
            self.trading_frame, variable=self.price_type_var,
            values=["LMT", "MKT"], state="disabled" # sj.PriceType.LMT, sj.PriceType.MKT
        )
        self.price_type_menu.grid(row=3, column=3, padx=5, pady=5, sticky="ew")

        # 下单按钮
        self.place_order_button = ctk.CTkButton(self.trading_frame, text="执行下单", command=self.handle_place_order, state="disabled")
        self.place_order_button.grid(row=4, column=0, columnspan=4, pady=15)
        
        # 配置列权重，使输入框等可以随窗口拉伸
        self.trading_frame.columnconfigure(1, weight=1)
        self.trading_frame.columnconfigure(3, weight=1)

    def create_quote_frame(self):
        self.quote_frame = ctk.CTkFrame(self, corner_radius=10)
        self.quote_frame.pack(pady=10, padx=20, fill="x")

        ctk.CTkLabel(self.quote_frame, text="实时行情订阅", font=ctk.CTkFont(size=16, weight="bold")).grid(row=0, column=0, columnspan=4, pady=10)

        # 股票代码输入
        ctk.CTkLabel(self.quote_frame, text="行情代码:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.quote_stock_code_entry = ctk.CTkEntry(self.quote_frame, placeholder_text="例如 2330", state="disabled")
        self.quote_stock_code_entry.grid(row=1, column=1, padx=5, pady=5, sticky="ew")

        # 行情类型选择
        ctk.CTkLabel(self.quote_frame, text="行情类型:").grid(row=1, column=2, padx=5, pady=5, sticky="w")
        self.quote_type_var = ctk.StringVar(value="both") # 默认订阅 tick 和 bidask
        self.quote_type_menu = ctk.CTkOptionMenu(
            self.quote_frame, variable=self.quote_type_var,
            values=["tick", "bidask", "both"], state="disabled"
        )
        self.quote_type_menu.grid(row=1, column=3, padx=5, pady=5, sticky="ew")

        # 订阅和取消订阅按钮
        self.subscribe_quote_button = ctk.CTkButton(self.quote_frame, text="订阅行情", command=self._handle_subscribe_quote, state="disabled")
        self.subscribe_quote_button.grid(row=2, column=0, columnspan=2, pady=10, padx=5, sticky="ew")
        
        self.unsubscribe_quote_button = ctk.CTkButton(self.quote_frame, text="取消订阅", command=self._handle_unsubscribe_quote, state="disabled")
        self.unsubscribe_quote_button.grid(row=2, column=2, columnspan=2, pady=10, padx=5, sticky="ew")

        # 行情显示区域
        ctk.CTkLabel(self.quote_frame, text="行情数据:", font=ctk.CTkFont(size=14)).grid(row=3, column=0, columnspan=4, pady=(10,0), sticky="w")
        self.quote_display_area = ctk.CTkTextbox(self.quote_frame, height=150, state="disabled", wrap="word") # wrap="none" 可能更好如果数据很长
        self.quote_display_area.grid(row=4, column=0, columnspan=4, sticky="nsew", padx=5, pady=5)
        
        self.quote_frame.columnconfigure(1, weight=1)
        self.quote_frame.columnconfigure(3, weight=1)

    def _handle_subscribe_quote(self):
        stock_code = self.quote_stock_code_entry.get().strip()
        quote_type = self.quote_type_var.get()
        if not stock_code:
            messagebox.showerror("订阅错误", "请输入股票代码。")
            return

        self.status_label.configure(text=f"状态: 正在订阅 {stock_code} ({quote_type}) 行情...")
        self.update_idletasks()
        success, message = self.api_client.subscribe_stock_quote(stock_code, quote_type)
        if success:
            messagebox.showinfo("订阅结果", message)
            self.status_label.configure(text=f"状态: {message}", text_color="green")
        else:
            messagebox.showerror("订阅失败", message)
            self.status_label.configure(text=f"状态: 订阅失败 - {message}", text_color="orange")

    def _handle_unsubscribe_quote(self):
        stock_code = self.quote_stock_code_entry.get().strip()
        quote_type = self.quote_type_var.get() # API层面会处理取消 'tick' 和 'bidask' if 'both'

        if not stock_code:
            messagebox.showwarning("取消订阅", "请输入要取消订阅的股票代码。")
            return

        self.status_label.configure(text=f"状态: 正在取消订阅 {stock_code} ({quote_type}) 行情...")
        self.update_idletasks()
        success, message = self.api_client.unsubscribe_stock_quote(stock_code, quote_type)
        
        if success:
            messagebox.showinfo("取消订阅结果", message)
            self.status_label.configure(text=f"状态: {message}", text_color="green")
        else:
            messagebox.showerror("取消订阅失败", message)
            self.status_label.configure(text=f"状态: 取消订阅失败 - {message}", text_color="orange")
            return

        self.status_label.configure(text=f"状态: 正在取消订阅 {stock_code} ({quote_type}) 行情...")
        self.update_idletasks()
        success, message = self.api_client.unsubscribe_stock_quote(stock_code, quote_type)
        if success:
            messagebox.showinfo("取消订阅结果", message)
            self.status_label.configure(text=f"状态: {message}", text_color="green")
        else:
            messagebox.showerror("取消订阅失败", message)
            self.status_label.configure(text=f"状态: 取消订阅失败 - {message}", text_color="orange")

    def _gui_handle_tick_data(self, tick_data):
        # UI更新需要在主线程中进行
        def update_ui():
            if self.quote_display_area.winfo_exists(): # 确保组件还存在
                self.quote_display_area.configure(state="normal")
                # 只显示当前订阅代码的行情，或者可以设计成显示多个
                current_subscribed_code = self.quote_stock_code_entry.get().strip() # 简单示例
                if tick_data.get("code") == current_subscribed_code or not current_subscribed_code:
                    display_text = f"Tick [{tick_data.get('datetime')} - {tick_data.get('code')}]: C={tick_data.get('close')} V={tick_data.get('volume')}\n"
                    self.quote_display_area.insert("0.0", display_text) # 插入到最前面
                    # 可以限制显示的行数
                    # lines = self.quote_display_area.get("1.0", "end-1c").splitlines()
                    # if len(lines) > 50: # 保留最近50条
                    #    self.quote_display_area.delete(f"{len(lines)}.0", "end")
                self.quote_display_area.configure(state="disabled")
        self.after(0, update_ui)


    def _gui_handle_bidask_data(self, bidask_data):
        # UI更新需要在主线程中进行
        def update_ui():
            if self.quote_display_area.winfo_exists():
                self.quote_display_area.configure(state="normal")
                current_subscribed_code = self.quote_stock_code_entry.get().strip() # 简单示例
                if bidask_data.get("code") == current_subscribed_code or not current_subscribed_code:
                    bid_prices = bidask_data.get('bid_price', [])
                    bid_vols = bidask_data.get('bid_volume', [])
                    ask_prices = bidask_data.get('ask_price', [])
                    ask_vols = bidask_data.get('ask_volume', [])
                    
                    display_text = f"BidAsk [{bidask_data.get('datetime')} - {bidask_data.get('code')}]:\n"
                    for i in range(min(len(bid_prices), 5)): # 显示前5档
                        display_text += f"  Bid {i+1}: {bid_prices[i]} ({bid_vols[i]})\n"
                    for i in range(min(len(ask_prices), 5)):
                        display_text += f"  Ask {i+1}: {ask_prices[i]} ({ask_vols[i]})\n"
                    display_text += "-\n"
                    self.quote_display_area.insert("0.0", display_text)
                self.quote_display_area.configure(state="disabled")
        self.after(0, update_ui)

    def handle_place_order(self):
        self.status_label.configure(text="状态: 正在准备下单...")
        self.update_idletasks()

        stock_code = self.stock_code_entry.get().strip()
        action = self.action_var.get() # "Buy" or "Sell"
        price_str = self.price_entry.get().strip()
        quantity_str = self.quantity_entry.get().strip()
        order_type = self.order_type_var.get() # "ROD", "IOC", "FOK"
        price_type = self.price_type_var.get() # "LMT", "MKT"

        # --- 输入校验 ---
        if not stock_code:
            messagebox.showerror("下单错误", "股票代码不能为空。")
            self.status_label.configure(text="状态: 下单失败 - 缺少股票代码")
            return

        price = 0.0
        if price_type == "LMT": # 限价单需要价格
            if not price_str:
                messagebox.showerror("下单错误", "限价单需要填写价格。")
                self.status_label.configure(text="状态: 下单失败 - 缺少价格")
                return
            try:
                price = float(price_str)
                if price <= 0:
                    messagebox.showerror("下单错误", "价格必须大于0。")
                    self.status_label.configure(text="状态: 下单失败 - 价格无效")
                    return
            except ValueError:
                messagebox.showerror("下单错误", "价格格式不正确。")
                self.status_label.configure(text="状态: 下单失败 - 价格格式错误")
                return
        
        if not quantity_str:
            messagebox.showerror("下单错误", "数量不能为空。")
            self.status_label.configure(text="状态: 下单失败 - 缺少数量")
            return
        try:
            quantity = int(quantity_str)
            if quantity <= 0:
                messagebox.showerror("下单错误", "数量必须是正整数。")
                self.status_label.configure(text="状态: 下单失败 - 数量无效")
                return
        except ValueError:
            messagebox.showerror("下单错误", "数量格式不正确。")
            self.status_label.configure(text="状态: 下单失败 - 数量格式错误")
            return

        # 调用API Handler进行下单
        success, result = self.api_client.place_stock_order(
            stock_code=stock_code,
            price=price, # price_val 已经在 api_handler 中根据 price_type 处理
            quantity=quantity,
            action=action,
            order_type=order_type,
            price_type=price_type
        )

        if success:
            # result 是 trade 对象
            trade_info = f"订单状态: {result.status}\n" \
                         f"代码: {result.contract.code}\n" \
                         f"操作: {result.order.action}\n" \
                         f"价格: {result.order.price}\n" \
                         f"数量: {result.order.quantity}\n" \
                         f"订单ID: {result.order.id}"
            messagebox.showinfo("下单成功", f"下单请求已提交。\n{trade_info}")
            self.status_label.configure(text=f"状态: 下单成功 - {result.status}", text_color="green")
            # 成功下单后可以考虑刷新持仓和余额
            self.fetch_and_display_account_info()
        else:
            # result 是错误信息字符串
            messagebox.showerror("下单失败", f"下单失败: {result}")
            self.status_label.configure(text=f"状态: 下单失败 - {result}", text_color="red")


    def handle_login(self):
        self.status_label.configure(text="状态: 正在登录...")
        self.update_idletasks() # 强制UI更新

        creds = {key: var.get() for key, var in self.entries.items()}
        
        # 从字典中按顺序提取凭证
        api_token = creds.get('api_token', '')
        api_secret_key = creds.get('api_secret_key', '')
        ca_path = creds.get('ca_path', '')
        ca_passwd = creds.get('ca_password', '')
        person_id = creds.get('person_id', '')

        if not all([api_token, api_secret_key, ca_path, ca_passwd, person_id]):
            messagebox.showerror("登录错误", "所有凭证字段都必须填写。")
            self.status_label.configure(text="状态: 登录失败 - 缺少凭证")
            return

        success, message = self.api_client.login_and_activate_ca(
            api_token, api_secret_key, ca_path, ca_passwd, person_id
        )

        if success:
            self.status_label.configure(text=f"状态: {message}", text_color="green")
            messagebox.showinfo("登录成功", message)
            # 登录成功后可以禁用登录按钮或隐藏登录框，并获取账户信息
            self.login_button.configure(state="disabled")
            self.refresh_button.configure(state="normal")
            self.fetch_and_display_account_info()
            self.save_credentials_to_config()
            # 启用交易相关的UI组件
            self.stock_code_entry.configure(state="normal")
            self.action_menu.configure(state="normal")
            self.price_entry.configure(state="normal")
            self.quantity_entry.configure(state="normal")
            self.order_type_menu.configure(state="normal")
            self.price_type_menu.configure(state="normal")
            self.place_order_button.configure(state="normal")

            # 启用行情订阅组件
            self.quote_stock_code_entry.configure(state="normal")
            self.quote_type_menu.configure(state="normal")
            self.subscribe_quote_button.configure(state="normal")
            self.unsubscribe_quote_button.configure(state="normal")
            # self.quote_display_area 的状态由其回调函数自行管理
        else:
            self.status_label.configure(text=f"状态: 登录失败 - {message}", text_color="red")
            messagebox.showerror("登录失败", message)

    def fetch_and_display_account_info(self):
        # 清空旧信息
        # 清空旧信息 (确保 initial_info_label 也被清除)
        for widget in self.info_frame.winfo_children():
            widget.destroy()
        
        self.status_label.configure(text="状态: 正在获取账户信息...")
        self.update_idletasks()

        # 获取余额
        bal_success, bal_data = self.api_client.get_account_balance_details()
        if bal_success:
            ctk.CTkLabel(self.info_frame, text=f"账户余额: {bal_data['balance']}", font=ctk.CTkFont(size=14)).pack(pady=5, anchor="w")
            ctk.CTkLabel(self.info_frame, text=f"查询日期: {bal_data['date']}", font=ctk.CTkFont(size=12)).pack(pady=2, anchor="w")
            ctk.CTkLabel(self.info_frame, text=f"查询状态: {bal_data['status']}", font=ctk.CTkFont(size=12)).pack(pady=2, anchor="w")
        else:
            ctk.CTkLabel(self.info_frame, text=f"获取余额失败: {bal_data}", text_color="orange").pack(pady=5, anchor="w")

        # 获取持仓
        pos_success, pos_data = self.api_client.get_positions_details()
        if pos_success:
            if pos_data:
                ctk.CTkLabel(self.info_frame, text="\n当前持仓:", font=ctk.CTkFont(size=14, weight="bold")).pack(pady=10, anchor="w")
                
                # 使用 CTkScrollableFrame 来显示可能很长的持仓列表
                positions_scroll_frame = ctk.CTkScrollableFrame(self.info_frame, height=250) # 稍微增加高度
                positions_scroll_frame.pack(fill="both", expand=True, padx=5, pady=5)

                # 定义表头和列配置
                headers = ["ID", "代码", "方向", "数量", "成本价", "现价", "盈亏"]
                col_weights = [0, 1, 0, 0, 1, 1, 1] # 代码、成本、现价、盈亏列可以扩展
                col_sticky = ["w", "w", "w", "e", "e", "e", "e"] # 对齐方式
                col_minwidths = [30, 70, 40, 50, 70, 70, 80]


                for col_idx, header_text in enumerate(headers):
                    positions_scroll_frame.columnconfigure(col_idx, weight=col_weights[col_idx], minsize=col_minwidths[col_idx])
                    header_label = ctk.CTkLabel(positions_scroll_frame, text=header_text, font=ctk.CTkFont(size=12, weight="bold"))
                    header_label.grid(row=0, column=col_idx, padx=3, pady=3, sticky="nsew")
                
                # 分隔线 (可选，或者通过框架边框)
                # separator = ctk.CTkFrame(positions_scroll_frame, height=2, fg_color="gray70")
                # separator.grid(row=1, column=0, columnspan=len(headers), sticky="ew", pady=2)

                for row_idx, pos in enumerate(pos_data, start=1): # 从第1行开始放数据 (0是表头)
                    data_to_display = [
                        pos['id'],
                        pos['code'],
                        pos['direction'],
                        pos['quantity'],
                        f"{pos['price']:.2f}",
                        f"{pos['last_price']:.2f}",
                        f"{pos['pnl']:.2f}"
                    ]
                    for col_idx, data_val in enumerate(data_to_display):
                        cell_label = ctk.CTkLabel(positions_scroll_frame, text=str(data_val), font=ctk.CTkFont(size=11))
                        cell_label.grid(row=row_idx, column=col_idx, padx=3, pady=1, sticky=col_sticky[col_idx])
            else:
                ctk.CTkLabel(self.info_frame, text="当前没有持仓记录。", font=ctk.CTkFont(size=12)).pack(pady=5, anchor="w")
        else:
            ctk.CTkLabel(self.info_frame, text=f"获取持仓失败: {pos_data}", text_color="orange").pack(pady=5, anchor="w")
        
        self.status_label.configure(text="状态: 账户信息已更新", text_color="green")

    def load_credentials_from_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    creds = json.load(f)
                
                for key, value in creds.items():
                    if key in self.entries: # self.entries 存储的是 {'api_token': StringVar, ...}
                        self.entries[key].set(value)
                print(f"凭证已从 {CONFIG_FILE} 加载。")
                self.status_label.configure(text="状态: 已加载保存的凭证。")
            except json.JSONDecodeError:
                print(f"错误: {CONFIG_FILE} 格式不正确。")
                messagebox.showwarning("加载配置错误", f"{CONFIG_FILE} 文件格式错误，无法加载凭证。")
            except Exception as e:
                print(f"加载凭证时发生错误: {e}")
                messagebox.showerror("加载配置错误", f"加载凭证时发生未知错误: {e}")
        else:
            print(f"{CONFIG_FILE} 未找到，不加载凭证。")

    def save_credentials_to_config(self):
        creds_to_save = {}
        for key, var in self.entries.items():
            if key == 'ca_password': # 不保存 CA Password
                continue
            creds_to_save[key] = var.get()
            
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump(creds_to_save, f, indent=4)
            print(f"凭证（除CA密码外）已保存到 {CONFIG_FILE}。")
        except Exception as e:
            print(f"保存凭证时发生错误: {e}")
            messagebox.showerror("保存配置错误", f"保存凭证时发生错误: {e}")


if __name__ == "__main__":
    app = TradingApp()
    app.mainloop()