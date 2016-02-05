#!/bin/bash
# Create ntViz html file directly from caffe log files.
# Ayan Chakrabarti <ayanc@ttic.edu>

# BASE URL of your .js and .css assets. Update this if you make
# changes, or want to deploy this somewhere on a local network.
if [ -z "$NTVPATH" ]; then
    NTVPATH='https://ayanc.github.io/ntviz/'
fi

function parseLog {
    # Test data
    grep 'Test net output #0:[^=]*' $1 -m 1 &>/dev/null
    if [[ $? -eq 0 ]]; then
	lbpfx="${3}Test."
	echo -ne "{it:[" >> "$2"
	cat $1 | grep -o 'Iteration [0-9]*, Testing net (#0)' | cut -f 2 -d ' ' | tr -d '\n' | sed s/000000,/e6,/g | sed s/00000,/e5,/g | sed s/0000,/e4,/g | sed s/000,/e3,/g >> "$2"
	echo -ne '],' >> "$2"
    
	echo -ne 'val:[' >> "$2"
	sq=0
	lstr='lbls:['
	while [[ $sq -le 100 ]]; do
	    lbl=`cat $1 |  grep 'Test net output #'$sq':[^=]*' -m 1 -o`
	    if [[ $? -gt 0 ]]; then
		break;
	    fi
	    lbl=`echo $lbl | cut -f 2 -d : | sed s/\ //g`
	    lstr="$lstr'$lbpfx$lbl',"

	    echo Found Test output: $lbl

	    echo -ne '[' >> "$2"
	    cat $1 | grep 'Test net output #'$sq':[^(]*' -o | cut -f 2 -d = | tr '\n' ',' | sed s/\ //g >> "$2"
	    echo -ne '],' >> "$2"

	    sq=$((sq+1))
	done

	echo -ne '],'$lstr'],},' >> "$2"
    else
	echo No Test Data
    fi

    ## Train data
    lbpfx="${3}Train."
    echo -ne "{it:[" >> "$2"
    cat $1 | grep -o "Iteration [0-9]*, loss =.*" | cut -f 2 -d ' ' | tr -d '\n' | sed s/000000,/e6,/g | sed s/00000,/e5,/g | sed s/0000,/e4,/g | sed s/000,/e3,/g >> "$2"
    echo -ne '],' >> "$2"

    echo -ne 'val:[[' >> "$2"
    cat $1 | grep -o "Iteration [0-9]*, loss =.*" | cut -f 5 -d ' ' | tr '\n' ',' >> "$2"
    echo -ne '],' >> "$2"

    # Is there more than one train output ?
    grep 'Train net output #1:[^=]*' $1 -m 1 &>/dev/null
    if [[ $? -eq 0 ]]; then
	lstr="lbls:['${lbpfx}total',"

	sq=0
	while [[ $sq -le 100 ]]; do
	    lbl=`cat $1 |  grep 'Train net output #'$sq':[^=]*' -m 1 -o`
	    if [[ $? -gt 0 ]]; then
		break;
	    fi
	    lbl=`echo $lbl | cut -f 2 -d : | sed s/\ //g`
	    lstr="$lstr'$lbpfx$lbl',"

	    echo Found Train output: $lbl

	    echo -ne '[' >> "$2"
	    cat $1 | grep 'Train net output #'$sq':[^(]*' -o | cut -f 2 -d = | tr '\n' ',' | sed s/\ //g >> "$2"
	    echo -ne '],' >> "$2"
	    sq=$((sq+1))
	done
    else
	lstr="lbls:['${lbpfx}loss',"
	echo Only one train output.
    fi
    echo -ne '],'$lstr'],},' >> "$2"
}

if [[ $# -le 1 ]]; then
    echo USAGE: cfviz out.html logfile[:lbl] [logfile[:lbl]] ...
    exit
fi

ofile="$1"
cat <<EOF > "$ofile"
<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="${NTVPATH}ntviz.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.14/d3.min.js"></script></head><body><div id='graph'></div>
<script>
EOF

echo -ne 'data=[' >> "$ofile"
tfile=`mktemp`

if [[ $# -eq 2 ]]; then
    IFS=':' read -a fields <<< "$2"
    if test -e "${fields[0]}"; then
	cp "${fields[0]}" $tfile
	parseLog $tfile "$ofile"
    fi
else
    shift
    fq=0
    while [[ $# -gt 0 ]]; do
	echo Processing $1
	IFS=':' read -a fields <<< "$1"
	if test -e "${fields[0]}"; then
	    cp "${fields[0]}" $tfile
	    if [[ x${fields[1]} == x ]]; then
		parseLog $tfile "$ofile" f$fq'.'
	    else
		parseLog $tfile "$ofile" "${fields[1]}."
	    fi
	fi
	shift
	fq=$((fq+1))
    done;
fi;

echo "];" >> "$ofile"
cat <<EOF >> "$ofile"
</script><script src="${NTVPATH}ntviz.js"></script></body></html>
EOF

rm $tfile
