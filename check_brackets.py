def check_brackets(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        # Ignore comments
        clean_line = line.split('//')[0]
        for j, char in enumerate(clean_line):
            if char == '{':
                stack.append(('{', i + 1, j + 1))
            elif char == '}':
                if not stack:
                    print(f"Extra closing bracket at line {i+1}, col {j+1}")
                    # return # Continue to find more
                else:
                    stack.pop()
    
    if stack:
        print(f"Found {len(stack)} unclosed brackets:")
        for char, line, col in stack[-10:]: # Show last 10
            print(f"Unclosed bracket '{char}' at line {line}, col {col}")
    else:
        print("Brackets are balanced.")

if __name__ == "__main__":
    import sys
    check_brackets(sys.argv[1])
