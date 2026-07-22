# Spreadsheet quality report

Source: `/Users/kinjiru/Documents/GitHub/lingua-stories/sent/chinese_words_categorized_expanded.xlsx`  
Worksheets: Summary, Categorized Words, Category Guide, Sources & Method  
Vocabulary worksheet: Categorized Words, header row 1

## Result

- Accepted rows: 2316
- Rejected rows: 0
- Empty rows: 0
- Duplicate normalized words: 1
- Duplicate category-guide labels: 0
- Errors: 0
- Warnings: 1054

## Warning classes

| Code | Count |
| --- | --- |
| ambiguous-entry | 864 |
| pinyin-review | 172 |
| missing-source-pinyin-repaired | 11 |
| possible-simplified-chinese | 3 |
| punctuation-problem | 3 |
| duplicate-word | 1 |

No malformed row is silently discarded; rejected rows and repaired source values are retained in the machine-readable report.
