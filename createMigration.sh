ext="sql"
n=1
path="./migrations/"
date=$(date +%Y-%m-%d)
desc="${1:?Usage: $0 <description>}"

while files=("${path}$(printf "%05d" "$n")_"*.${ext}); [[ -e "${files[0]}" ]]; do
  echo "${n}"
  ((n++))

done
  touch "${path}$(printf "%05d_%s_%s.%s" "$n" "$date" "$desc" "$ext")"

  echo "Done creating"

