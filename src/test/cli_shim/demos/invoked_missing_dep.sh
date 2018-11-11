say "$(cat << 'MSG'

If invoked embark is missing a dependency then report error and exit

MSG
)"

cd ~/working/embark/node_modules
mv opn opn-RENAMED

cd ~
nac lts

bash -i << 'DEMO'
embark version
DEMO

nac default
cd ~/working/embark/node_modules
mv opn-RENAMED opn
cd ~

say "$(cat << 'MSG'

If invoked embark is missing a dev dependency then report error and exit

MSG
)"

cd ~/working/embark/node_modules
mv sinon sinon-RENAMED

cd ~
nac lts

bash -i << 'DEMO'
embark version
DEMO

nac default
cd ~/working/embark/node_modules
mv sinon-RENAMED sinon
cd ~

say "$(cat << 'MSG'

If invoked embark is within a node_modules tree then dependencies are not checked

MSG
)"

cd ~/working/embark/node_modules
mv opn opn-RENAMED
cd ~/working
mkdir node_modules
mv embark node_modules/

cd ~
nac lts

bash -i << 'DEMO'
node ~/working/node_modules/embark/bin/embark version
DEMO

nac default
cd ~/working/node_modules
mv embark ../
cd ../
rmdir node_modules
cd ~/working/embark/node_modules
mv opn-RENAMED opn
cd ~

say "$(cat << 'MSG'

If invoked embark is within a node_modules tree then dev dependencies are not
checked

MSG
)"

cd ~/working/embark/node_modules
mv sinon sinon-RENAMED
cd ~/working
mkdir node_modules
mv embark node_modules/

cd ~
nac lts

bash -i << 'DEMO'
node ~/working/node_modules/embark/bin/embark version
DEMO

nac default
cd ~/working/node_modules
mv embark ../
cd ../
rmdir node_modules
cd ~/working/embark/node_modules
mv sinon-RENAMED sinon
cd ~
