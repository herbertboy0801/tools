# GitHub 仓库更新与 GitHub Pages 修复计划

## 目标

1.  确保仓库根目录的 `README.md` 文件正确显示在 GitHub 仓库主页。
2.  修复 GitHub Pages 网站因文件路径问题导致的 404 错误，使其能从根目录正确加载 `index.html`。

## 前提条件

*   用户已将 GitHub Pages 的发布源设置为从 `main` 分支的根目录 (`/ (root)`) 发布。

## 计划步骤

1.  **确保 `README.md` 在根目录并已推送**：
    *   切换到 Code 模式。
    *   (在 Code 模式下) 检查本地 Git 仓库 (`d:/code/Claudecode/`) 的状态，确认将 `README.md` 移动到根目录的提交 (应为 `d74b48f`) 是最新的，并且工作区是干净的。
    *   (在 Code 模式下) 执行 `git push origin main` 将此提交推送到远程仓库。如果遇到网络问题，需要进行诊断和解决。

2.  **将网站内容移动到根目录以修复 GitHub Pages**：
    *   (在 Code 模式下) 将 `d:/code/Claudecode/Test tool/` 目录下的所有内容（包括 `index.html` 文件、`distance-calculator/` 子目录、`teacher-payroll-system/` 子目录等相关网站文件和文件夹）全部移动到仓库的根目录 (`d:/code/Claudecode/`)。
    *   (在 Code 模式下) 如果 `Test tool/` 目录在移动后变空，则将其从 Git 中删除。
    *   (在 Code 模式下) 提交这些文件结构的更改，建议的 commit message 为: `"refactor: Move website content to root directory for GitHub Pages"`。
    *   (在 Code 模式下) 执行 `git push origin main` 将这些更改推送到远程仓库。

## 示意图 (Mermaid)

```mermaid
graph TD
    A[开始] --> B{本地 README 修复是否已推送?};
    B -- 否 --> C[切换到 Code 模式];
    C --> D[执行 git push (推送 README 修复)];
    D -- 成功 --> F;
    D -- 失败 --> E[解决推送问题];
    E --> D;
    B -- 是 --> F[已在 Code 模式或切换到 Code 模式];
    F --> G[移动 Test tool/* 内容到仓库根目录 /*];
    G --> H[删除空的 Test tool 目录];
    H --> I[git add . (添加所有更改)];
    I --> J[git commit -m "refactor: Move website to root for GH Pages"];
    J --> K[git push origin main];
    K -- 成功 --> L[结束: README 和 Pages 问题均解决];
    K -- 失败 --> M[解决推送问题];
    M --> K;
```

## 预期成果

*   GitHub 仓库主页正确显示根目录下的 `README.md` 内容。
*   GitHub Pages 网站 (通过 `herbertboy0801.github.io/tools/` 或类似 URL 访问) 能够正确加载根目录下的 `index.html` 并正常运行。