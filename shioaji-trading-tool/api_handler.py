import shioaji as sj
# Exchange 导入不再需要，因为我们将通过 api.Contracts 获取合约
# Action, OrderType, PriceType 应该通过 sj.xxx 访问

class ShioajiApiClient:
    def __init__(self):
        self.api = sj.Shioaji()
        self.stock_account = None # 将在登录后设置
        self.is_ca_activated = False
        
        # 行情回调相关
        self.gui_tick_callback = None
        self.gui_bidask_callback = None
        
        # 尝试设置 Shioaji 的行情回调处理函数
        # 注意：以下属性名 (on_tick, on_bidask) 是基于常见模式的假设，
        # 可能需要根据 Shioaji 的实际API进行调整。
        # Shioaji文档中提到 @api.quote.on_tick_stk_v1 / @api.quote.on_bidask_stk_v1 等装饰器用法
        # 这通常意味着API对象本身会调用这些被装饰的方法。
        # 我们将把这些方法定义在类中，并确保它们在api对象初始化后能被shioaji内部机制调用。
        # Shioaji 的回调似乎是通过装饰器模式在 Shioaji() 实例上设置的，
        # 例如 @api.quote.on_tick_stk_v1() def quote_callback(exchange, tick): ...
        # 这意味着 ShioajiApiClient 可能需要将回调方法传递给 Shioaji 实例，
        # 或者 Shioaji 实例会自动查找特定名称的方法。
        # 更简单的方式是，Shioaji() 实例化时，其 quote 对象会自动绑定这些回调。
        
        # 我们先定义回调方法，然后在 Shioaji() 初始化后，
        # Shioaji 内部机制应该能够将事件路由到这些方法（如果它们被正确装饰或命名）
        # 或者我们需要显式设置它们，例如 self.api.quote.set_on_tick_callback(self._handle_tick_data)
        # 从Shioaji文档看，更可能是装饰器用法，或者直接在api.quote对象上赋值回调函数。
        # 例如: api.quote.on_tick_stk_v1 = self._handle_tick_data (如果shioaji支持这种直接赋值)

        # 查阅 ShioajiPy github 示例，回调通常这样设置：
        # @api.quote.on_event
        # def quote_k_line_callback(self, exchange: Exchange, kline: KLine):
        #    pass # (KLine is sj.KLine)
        # @api.quote.on_event
        # def quote_tick_callback(self, exchange: Exchange, tick: Tick):
        #    pass # (Tick is sj.Tick)
        # @api.quote.on_event
        # def quote_bidask_callback(self, exchange: Exchange, bidask: BidAsk):
        _ = self.api.quote #确保 quote 对象被访问和初始化其事件机制
        self.api.quote.on_tick_stk_v1 = self._on_tick_stk_v1_callback
        self.api.quote.on_bidask_stk_v1 = self._on_bidask_stk_v1_callback
        # 其他类型的回调也可以类似设置，例如期货、期权等
        # self.api.quote.on_tick_fut_v1 = self._on_tick_fut_v1_callback
        # self.api.quote.on_bidask_fut_v1 = self._on_bidask_fut_v1_callback

        print("ShioajiApiClient initialized and quote callbacks set (hypothetically).")

    def _on_tick_stk_v1_callback(self, exchange: sj.Exchange, tick: sj.Tick):
        """处理股票 Tick 数据回调"""
        # print(f"API Handler Tick Data: Exchange={exchange}, Tick={tick}")
        if self.gui_tick_callback:
            try:
                # 将数据转换为GUI更易处理的字典格式
                tick_data = {
                    "code": tick.code,
                    "datetime": tick.datetime,
                    "open": tick.open,
                    "high": tick.high,
                    "low": tick.low,
                    "close": tick.close,
                    "volume": tick.volume,
                    "tick_type": str(tick.tick_type), # TickType.Deal
                    "simtrade": tick.simtrade,
                }
                self.gui_tick_callback(tick_data)
            except Exception as e:
                print(f"API Handler: Error in gui_tick_callback: {e}")

    def _on_bidask_stk_v1_callback(self, exchange: sj.Exchange, bidask: sj.BidAsk):
        """处理股票 BidAsk 数据回调"""
        # print(f"API Handler BidAsk Data: Exchange={exchange}, BidAsk={bidask}")
        if self.gui_bidask_callback:
            try:
                # 将数据转换为GUI更易处理的字典格式
                bidask_data = {
                    "code": bidask.code,
                    "datetime": bidask.datetime,
                    "bid_price": list(bidask.bid_price),
                    "bid_volume": list(bidask.bid_volume),
                    "ask_price": list(bidask.ask_price),
                    "ask_volume": list(bidask.ask_volume),
                    "simtrade": bidask.simtrade,
                }
                self.gui_bidask_callback(bidask_data)
            except Exception as e:
                print(f"API Handler: Error in gui_bidask_callback: {e}")

    def set_gui_tick_callback(self, callback):
        print(f"API Handler: GUI Tick callback set to {callback}")
        self.gui_tick_callback = callback

    def set_gui_bidask_callback(self, callback):
        print(f"API Handler: GUI BidAsk callback set to {callback}")
        self.gui_bidask_callback = callback

    def subscribe_stock_quote(self, stock_code: str, quote_type: str = "both"):
        """
        订阅指定股票代码的行情。
        quote_type: "tick", "bidask", or "both"
        返回 (success_bool, message)
        """
        if not self.api or not self.is_ca_activated:
            return False, "API not logged in or CA not activated."
        if not stock_code:
            return False, "Stock code cannot be empty."
        
        try:
            contract = self.api.Contracts.Stocks[stock_code]
            if not contract:
                 return False, f"Could not find contract for stock code: {stock_code}"

            print(f"API Handler: Subscribing to {stock_code}, type: {quote_type}")
            
            subscribed_tick = False
            subscribed_bidask = False

            if quote_type == "tick" or quote_type == "both":
                self.api.quote.subscribe(contract, quote_type='tick')
                # self.api.quote.subscribe(contract, quote_type=sj.constant.QuoteType.Tick) # 另一种写法
                subscribed_tick = True
                print(f"API Handler: Subscribed to Ticks for {stock_code}")
            
            if quote_type == "bidask" or quote_type == "both":
                self.api.quote.subscribe(contract, quote_type='bidask')
                # self.api.quote.subscribe(contract, quote_type=sj.constant.QuoteType.BidAsk) # 另一种写法
                subscribed_bidask = True
                print(f"API Handler: Subscribed to BidAsk for {stock_code}")

            if subscribed_tick or subscribed_bidask:
                return True, f"Successfully initiated subscription for {stock_code} (Tick: {subscribed_tick}, BidAsk: {subscribed_bidask})."
            else:
                return False, f"Invalid quote_type: {quote_type}. Choose 'tick', 'bidask', or 'both'."

        except KeyError:
            return False, f"Invalid stock code or contract not found: {stock_code}"
        except Exception as e:
            return False, f"Error subscribing to stock quote for {stock_code}: {str(e)}"

    def unsubscribe_stock_quote(self, stock_code: str, quote_type: str = "both"):
        """
        取消订阅指定股票代码的行情。
        quote_type: "tick", "bidask", or "both"
        返回 (success_bool, message)
        """
        if not self.api:
            return False, "API not initialized."
        if not stock_code:
            return False, "Stock code cannot be empty."

        try:
            contract = self.api.Contracts.Stocks[stock_code]
            if not contract:
                 return False, f"Could not find contract for stock code: {stock_code}"
            
            print(f"API Handler: Unsubscribing from {stock_code}, type: {quote_type}")
            unsubscribed_tick = False
            unsubscribed_bidask = False

            if quote_type == "tick" or quote_type == "both":
                self.api.quote.unsubscribe(contract, quote_type='tick')
                unsubscribed_tick = True
                print(f"API Handler: Unsubscribed from Ticks for {stock_code}")

            if quote_type == "bidask" or quote_type == "both":
                self.api.quote.unsubscribe(contract, quote_type='bidask')
                unsubscribed_bidask = True
                print(f"API Handler: Unsubscribed from BidAsk for {stock_code}")
            
            if unsubscribed_tick or unsubscribed_bidask:
                return True, f"Successfully unsubscribed for {stock_code} (Tick: {unsubscribed_tick}, BidAsk: {unsubscribed_bidask})."
            else:
                return False, f"Invalid quote_type: {quote_type} for unsubscribe."

        except KeyError:
            return False, f"Invalid stock code or contract not found for unsubscribe: {stock_code}"
        except Exception as e:
            return False, f"Error unsubscribing from stock quote for {stock_code}: {str(e)}"

    def login_and_activate_ca(self, api_token, api_secret_key, ca_path, ca_passwd, person_id):
        """
        处理登录和CA证书激活。
        返回 (success_bool, message_or_data)
        """
        try:
            print("API Handler: Attempting to login...")
            accounts = self.api.login(api_token, api_secret_key)
            print(f"API Handler: Login successful. Accounts: {accounts}")

            # 寻找股票账户
            self.stock_account = None
            if accounts:
                for acc in accounts:
                    if isinstance(acc, sj.account.StockAccount):
                        self.stock_account = acc
                        # 将 stock_account 也设置为 api 对象的默认股票账户，方便后续调用
                        self.api.set_default_account(self.stock_account)
                        print(f"API Handler: Stock account found and set as default: {self.stock_account}")
                        break
            
            if not self.stock_account:
                return False, "Login successful, but no stock account found."

            print("API Handler: Attempting to activate CA...")
            self.api.activate_ca(
                ca_path=ca_path,
                ca_passwd=ca_passwd,
                person_id=person_id
            )
            self.is_ca_activated = True
            print("API Handler: CA activation successful.")
            return True, "Login and CA activation successful."

        except Exception as e:
            print(f"API Handler: Error during login or CA activation: {e}")
            return False, str(e)

    def get_account_balance_details(self):
        """
        获取账户余额。
        返回 (success_bool, data_or_error_message)
        """
        if not self.api or not self.is_ca_activated: # 确保已登录并激活CA
            return False, "API not logged in or CA not activated."
        try:
            balance = self.api.account_balance()
            print(f"API Handler: Raw balance object: {balance}") # 新增打印
            # 基于之前的成功经验，我们假设 balance 对象包含所需数据
            if balance and hasattr(balance, 'acc_balance') and \
               (not hasattr(balance, 'errmsg') or not balance.errmsg):
                result_data = {
                    "balance": balance.acc_balance,
                    "date": str(balance.date), # 转为字符串以方便显示
                    "status": str(balance.status) if hasattr(balance, 'status') else "N/A"
                }
                print(f"API Handler: Returning balance success: True, data: {result_data}") # 新增打印
                return True, result_data
            elif balance and hasattr(balance, 'errmsg') and balance.errmsg:
                error_msg = f"Error fetching balance: {balance.errmsg}"
                print(f"API Handler: Returning balance success: False, error: {error_msg}") # 新增打印
                return False, error_msg
            else:
                error_msg = "Failed to fetch or parse balance information."
                print(f"API Handler: Returning balance success: False, error: {error_msg}") # 新增打印
                return False, error_msg
        except Exception as e:
            return False, f"Exception while fetching balance: {str(e)}"

    def get_positions_details(self):
        """
        获取当前持仓。
        返回 (success_bool, data_or_error_message)
        """
        if not self.api or not self.is_ca_activated or not self.stock_account:
            return False, "API not logged in, CA not activated, or stock account not set."
        try:
            positions_raw = self.api.list_positions(self.stock_account) # 使用已设置的 stock_account
            print(f"API Handler: Raw positions object: {positions_raw}") # 新增打印
            
            if positions_raw and isinstance(positions_raw, list):
                positions_formatted = []
                for pos in positions_raw:
                    positions_formatted.append({
                        "id": pos.id,
                        "code": pos.code,
                        "direction": str(pos.direction).split('.')[-1],
                        "quantity": pos.quantity,
                        "price": float(pos.price) if hasattr(pos, 'price') else 0.0,
                        "last_price": float(pos.last_price) if hasattr(pos, 'last_price') else 0.0,
                        "pnl": float(pos.pnl) if hasattr(pos, 'pnl') else 0.0,
                        "yd_quantity": pos.yd_quantity
                    })
                print(f"API Handler: Returning positions success: True, data: {positions_formatted}") # 新增打印
                return True, positions_formatted
            elif positions_raw and isinstance(positions_raw, list) and len(positions_raw) == 0:
                 print(f"API Handler: Returning positions success: True, data: [] (No positions)") # 新增打印
                 return True, [] # 没有持仓也是成功获取
            else:
                error_msg = "Failed to fetch or parse positions information."
                print(f"API Handler: Returning positions success: False, error: {error_msg}") # 新增打印
                return False, error_msg
        except Exception as e:
            return False, f"Exception while fetching positions: {str(e)}"

    def place_stock_order(self, stock_code: str, price: float, quantity: int,
                            action: str, order_type: str, price_type: str):
        """
        下股票订单。
        action: "Buy" or "Sell"
        order_type: "ROD", "IOC", "FOK"
        price_type: "LMT" (限价), "MKT" (市价)
        返回 (success_bool, message_or_trade_object)
        """
        if not self.api or not self.is_ca_activated or not self.stock_account:
            return False, "API not logged in, CA not activated, or stock account not set."

        try:
            # 参数转换和校验
            if not stock_code:
                return False, "股票代码不能为空。"
            try:
                price_val = float(price) if price_type == "LMT" else 0.0 # 市价单价格通常为0
            except ValueError:
                return False, "价格必须是有效的数字。"
            try:
                quantity_val = int(quantity)
                if quantity_val <= 0:
                    return False, "数量必须是正整数。"
            except ValueError:
                return False, "数量必须是有效的整数。"

            # 将字符串转换为 Shioaji 枚举类型
            action_enum = getattr(sj.constant.Action, action, None)
            order_type_enum = getattr(sj.constant.OrderType, order_type, None)
            price_type_enum = getattr(sj.constant.StockPriceType, price_type, None) # 注意是 StockPriceType

            if not all([action_enum, order_type_enum, price_type_enum]):
                missing = []
                if not action_enum: missing.append(f"操作类型({action})")
                if not order_type_enum: missing.append(f"订单类型({order_type})")
                if not price_type_enum: missing.append(f"价格类型({price_type})")
                return False, f"无效的枚举值: {', '.join(missing)}"

            # 创建合约对象 (使用 context7 示例的方式)
            # 假设 self.api 已经初始化
            try:
                contract = self.api.Contracts.Stocks[stock_code]
            except KeyError:
                return False, f"无效的股票代码或无法找到合约: {stock_code}"
            except Exception as e:
                return False, f"获取合约时发生错误: {str(e)}"
            
            if not contract: # 双重检查
                 return False, f"未能获取股票代码 {stock_code} 的合约信息。"

            # 创建订单对象
            order = sj.Order(
                price=price_val,
                quantity=quantity_val,
                action=action_enum,
                price_type=price_type_enum,
                order_type=order_type_enum,
            )
            
            print(f"API Handler: Placing order. Contract: {contract}, Order: {order}")
            trade = self.api.place_order(contract, order, timeout=10000) # timeout in ms
            print(f"API Handler: Order placed. Trade object: {trade}")

            return True, trade # 返回整个 trade 对象
        except Exception as e:
            print(f"API Handler: Error placing order: {e}")
            return False, f"下单时发生错误: {str(e)}"

if __name__ == '__main__':
    # 这里可以添加一些简单的测试代码，但主要逻辑由GUI调用
    print("api_handler.py executed directly. This module is intended to be used by gui.py.")