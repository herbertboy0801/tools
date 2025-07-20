import shioaji as sj
import os # 建议用于处理路径
import getpass # 用于安全输入密码

def get_credentials():
    """从控制台获取用户凭证"""
    print("\n--- 请输入您的 Shioaji API 凭证 ---")
    api_token = input("API Token: ")
    api_secret_key = getpass.getpass("API Secret Key (输入时不可见): ")
    ca_path = input(r"CA 证书路径 (例如 C:\path\to\your\certificate.pfx): ")
    ca_passwd = getpass.getpass("CA 证书密码 (输入时不可见): ")
    person_id = input("Person ID (与 CA 证书关联): ")
    print("--- 凭证输入完毕 ---\n")
    return api_token, api_secret_key, ca_path, ca_passwd, person_id

def main():
    # 从控制台获取凭证
    api_token, api_secret_key, ca_path, ca_passwd, person_id = get_credentials()

    print("正在初始化 Shioaji API...")
    api = sj.Shioaji()

    # 打印部分信息以供确认（可选，如果担心敏感信息打印到控制台可以注释掉）
    print(f"使用的 API Token (部分): {api_token[:4]}...{api_token[-4:] if len(api_token) > 8 else ''}")
    print(f"使用的 CA 路径: {ca_path}")

    try:
        print("正在登录 Shioaji API...")
        # 使用 login 方法登录，传入您的 API Token 和 Secret Key
        # login 方法会返回一个包含可用账户信息的列表，我们这里暂时不处理它
        accounts = api.login(api_token, api_secret_key)
        print("Shioaji API 登录成功！")
        print("可用账户信息:", accounts)

        # --- 探查账户对象 ---
        if accounts and len(accounts) > 0:
            stock_account = None
            # 遍历查找股票账户，通常 login 后返回的列表中会有不同类型的账户对象
            for acc in accounts:
                # 假设股票账户类型是 sj.account.StockAccount
                # 您可能需要根据实际的 Shioaji API 文档确认准确的账户类型
                if isinstance(acc, sj.account.StockAccount):
                    stock_account = acc
                    print(f"\n找到股票账户: {stock_account}")
                    break # 获取第一个找到的股票账户即可

            if stock_account:
                print(f"\n--- 详细探查第一个股票账户 (类型: {type(stock_account)}) ---")
                
                # 尝试打印对象的 __dict__ (如果可用)，它通常包含实例的属性
                try:
                    print(f"\n账户对象的 __dict__ (实例属性):")
                    for key, value in stock_account.__dict__.items():
                        print(f"  {key}: {value}")
                except AttributeError:
                    print("  账户对象没有 __dict__ 属性或无法直接访问。")

                # 列出对象的所有属性和方法，帮助我们找到相关信息
                print("\n账户对象的所有可用属性和方法 (dir()):")
                count = 0
                for attr in dir(stock_account):
                    if not attr.startswith('_'): # 简单过滤掉私有/魔法方法，使列表更易读
                        print(f"  {attr}", end=", " if count % 5 != 4 else "\n  ")
                        count += 1
                if count % 5 != 0: print() # 确保最后一行也换行
                print("--- 账户探查结束 ---")
            else:
                print("\n在返回的 accounts 列表中未找到 StockAccount 类型的对象。")
        else:
            print("\n登录后未返回任何账户信息。")
        # --- 账户探查结束 ---

        # --- 探查主 API 对象 ---
        print(f"\n--- 详细探查主 API 对象 (类型: {type(api)}) ---")
        print("\n主 API 对象的所有可用属性和方法 (dir()):")
        count = 0
        for attr in dir(api):
            if not attr.startswith('_'): # 简单过滤掉私有/魔法方法
                print(f"  {attr}", end=", " if count % 5 != 4 else "\n  ")
                count += 1
        if count % 5 != 0: print() # 确保最后一行也换行
        print("--- 主 API 对象探查结束 ---")
        # --- 主 API 对象探查结束 ---

        print("\n正在激活 CA 证书...")
        # 使用 activate_ca 方法激活数字证书
        # 需要提供 CA 证书的路径 (ca_path)、密码 (ca_passwd) 和 Person ID (person_id)
        api.activate_ca(
            ca_path=ca_path,
            ca_passwd=ca_passwd,
            person_id=person_id
        )
        print("CA 证书激活成功！")

        # --- 查询账户信息 ---
        print("\n--- 开始查询账户信息 ---")
        
        # 1. 查询账户余额
        try:
            print("\n正在查询账户余额...")
            # 假设 account_balance() 不需要特定参数，或者会使用默认账户
            # 如果需要指定账户，可能是 api.account_balance(account=api.stock_account)
            # 或 api.account_balance(api.stock_account.account_id)
            # 我们先尝试不带参数调用
            balance = api.account_balance()
            print("账户余额信息:")
            # 检查 balance 对象是否存在，是否有 acc_balance 属性，并且 errmsg 为空
            if balance and hasattr(balance, 'acc_balance') and hasattr(balance, 'date') and \
               (not hasattr(balance, 'errmsg') or not balance.errmsg):
                print(f"  账户余额: {balance.acc_balance}")
                print(f"  查询日期: {balance.date}")
                if hasattr(balance, 'status'): # 仍然尝试打印状态，但不依赖它进行逻辑判断
                    print(f"  查询状态: {balance.status}")
            elif balance and hasattr(balance, 'errmsg') and balance.errmsg:
                print(f"  查询失败，错误信息: {balance.errmsg}")
                print(f"  原始余额数据: {balance}")
            elif balance: # 其他情况，但仍有 balance 对象
                print(f"  未能完全解析账户余额信息，原始数据: {balance}")
            else:
                print("  未能获取账户余额信息或账户余额为空。")
        except Exception as e_balance:
            print(f"查询账户余额时发生错误: {e_balance}")

        # 2. 查询当前持仓
        try:
            print("\n正在查询当前持仓...")
            # 假设 list_positions() 不需要特定参数，或者会使用默认账户
            # 同样，如果需要指定账户，可能是 api.list_positions(account=api.stock_account)
            # 我们先尝试不带参数调用
            positions = api.list_positions(api.stock_account) # 尝试传入 stock_account
            print("\n当前持仓信息:")
            if positions and isinstance(positions, list) and len(positions) > 0:
                print(f"  共 {len(positions)} 条持仓记录:")
                header = f"{'ID':<5} | {'代码':<8} | {'方向':<5} | {'数量':>5} | {'成本价':>10} | {'现价':>10} | {'盈亏':>12} | {'昨日数量':>8}"
                print(f"  {header}")
                print(f"  {'-'*len(header)}")
                for pos in positions:
                    # 假设 pos 对象有这些属性，根据用户提供的输出调整
                    direction_str = str(pos.direction).split('.')[-1] # 获取 'Buy' 或 'Sell'
                    print(f"  {pos.id:<5} | {pos.code:<8} | {direction_str:<5} | {pos.quantity:>5} | {pos.price:>10.2f} | {pos.last_price:>10.2f} | {pos.pnl:>12.2f} | {pos.yd_quantity:>8}")
            elif positions and isinstance(positions, list) and len(positions) == 0:
                print("  目前没有持仓。")
            elif positions: # 如果不是列表但有内容
                 print(f"  原始持仓数据: {positions}")
            else:
                print("  目前没有持仓，或未能获取到持仓信息。")
        except Exception as e_positions:
            print(f"查询当前持仓时发生错误: {e_positions}")
            
        print("\n--- 账户信息查询结束 ---")
        # --- 账户信息查询结束 ---

        # 在这里可以开始进行其他操作，例如查询账户信息、下单等
        # print("\n准备进行其他操作...")
        # TODO: 实现其他功能模块的调用

    except Exception as e:
        print(f"发生错误: {e}")
        # 可以在这里添加更详细的错误处理逻辑

    finally:
        # 登出 API (如果 shioaji 提供显式登出方法)
        # 目前 shioaji 的文档似乎没有明确的 api.logout() 方法
        # 通常，当 API 对象被垃圾回收时，连接可能会自动关闭
        # 或者，如果需要，可以研究是否有其他资源清理方法
        print("\n程序执行完毕。")
        # api.logout() # 如果有此方法

if __name__ == "__main__":
    # 确保在虚拟环境中运行此脚本
    # 检查是否在虚拟环境中 (一个简单但不完全可靠的方法)
    if os.getenv('VIRTUAL_ENV'):
        print(f"正在虚拟环境 '{os.getenv('VIRTUAL_ENV')}' 中运行。")
    else:
        print("警告：似乎不在虚拟环境中运行。建议在项目的虚拟环境中执行此脚本。")
        # 可以选择在这里退出或继续，取决于严格程度
        # exit("请在虚拟环境中运行。")

    main()