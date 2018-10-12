say "$(cat << 'MSG'

Intended "Unsupported runtime" error messages are displayed for node >= 4.0.0

MSG
)"

cd ~/embark_demo
nac 4.0.0

bash -i << 'DEMO'
node ~/working/embark/bin/embark version
DEMO

nac default
cd ~
